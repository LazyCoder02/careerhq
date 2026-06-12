import type { RawJob } from '@/types/jobs'
import { getEnabledSources } from './sources'
import { upsertJobs, getAllJobs } from './store'
import { matchJob } from './matching'
import { getUserProfile } from '@/lib/profile'

export interface SourceResult {
  source: string
  fetched: number
  error?: string
}

export interface IngestSummary {
  ranAt: string
  sources: SourceResult[]
  inserted: number
  updated: number
  total: number
  /** Counts of READY / STRETCH jobs across the whole store after this run. */
  matches: { ready: number; stretch: number }
}

/**
 * Max jobs persisted per ingestion run, across all sources combined. Apify
 * bills per scraped job, so we keep each run tiny — bump this if you want more
 * coverage per cycle.
 */
const JOBS_PER_RUN = 3

/** Lowercased hints that a job is in Poland (cities + country names). */
const POLAND_HINTS = [
  'poland', 'polska', 'pl', 'warsaw', 'warszawa', 'krak', 'wroc', 'gdan', 'gdań',
  'pozna', 'lodz', 'łódź', 'katowice', 'szczecin', 'lublin', 'bydgoszcz', 'gdynia',
]

/** A job counts as Poland if it's from the Polish board, or its location says so. */
function isInPoland(job: RawJob): boolean {
  if (job.source === 'justjoin') return true // Poland-native board
  const loc = job.location?.toLowerCase() ?? ''
  return POLAND_HINTS.some((h) => loc.includes(h))
}

/** Keep jobs in Poland whose workplace type is among the user's selected ones. */
function applyLocationAndWorkplace(jobs: RawJob[], country: string, types: string[]): RawJob[] {
  const polandWanted = country.toLowerCase().includes('poland')
  return jobs.filter((j) => {
    if (polandWanted && !isInPoland(j)) return false
    // No workplace type on the job, or no preference set => don't over-filter.
    if (!types.length || !j.workplaceType) return true
    return types.includes(j.workplaceType)
  })
}

/**
 * One ingestion cycle: pull from every enabled source, normalise + store, then
 * report how the user's current aptitudes map onto the full job set.
 *
 * A single source failing is non-fatal — its error is recorded and the others
 * still run, so one flaky provider can't blank the whole scheduled run.
 */
export async function runIngestion(now: string): Promise<IngestSummary> {
  const profile = await getUserProfile()
  const sources = getEnabledSources()
  const { country, workplaceTypes } = profile.preferences

  const query = {
    role: profile.targetRole,
    country,
    workplaceTypes,
    remoteOnly: profile.preferences.remoteOnly,
    limit: JOBS_PER_RUN,
  }

  const collected: RawJob[] = []
  const results: SourceResult[] = []

  for (const source of sources) {
    try {
      const jobs = await source.fetch(query)
      collected.push(...jobs)
      results.push({ source: source.id, fetched: jobs.length })
    } catch (err) {
      results.push({
        source: source.id,
        fetched: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Poland-only + selected workplace types, then newest JOBS_PER_RUN across sources.
  const filtered = applyLocationAndWorkplace(collected, country, workplaceTypes)
  const trimmed = filtered
    .sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''))
    .slice(0, JOBS_PER_RUN)

  const { inserted, updated, total } = await upsertJobs(trimmed, now)

  // Recompute classification across the full store against the current profile.
  const all = await getAllJobs()
  let ready = 0
  let stretch = 0
  for (const job of all) {
    const category = matchJob(job, profile).category
    if (category === 'READY') ready++
    else if (category === 'STRETCH') stretch++
  }

  return {
    ranAt: now,
    sources: results,
    inserted,
    updated,
    total,
    matches: { ready, stretch },
  }
}
