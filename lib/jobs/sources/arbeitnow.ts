import type { RawJob } from '@/types/jobs'
import type { JobSource, JobQuery } from './types'

const ENDPOINT = 'https://www.arbeitnow.com/api/job-board-api'

/** Shape of a single entry in the Arbeitnow job-board feed. */
interface ArbeitnowJob {
  slug: string
  company_name: string
  title: string
  description: string
  remote: boolean
  url: string
  tags: string[]
  job_types: string[]
  location: string
  created_at: number
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[]
}

/**
 * Arbeitnow public job-board API — free, no key, no auth. Used as the default
 * working source so the whole pipeline is verifiable without any credentials.
 */
export const arbeitnowSource: JobSource = {
  id: 'arbeitnow',
  label: 'Arbeitnow',

  isEnabled() {
    return true
  },

  async fetch(query: JobQuery): Promise<RawJob[]> {
    const res = await fetch(ENDPOINT, {
      headers: { Accept: 'application/json' },
      // Always pull fresh data on a scheduled run.
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      throw new Error(`Arbeitnow responded ${res.status} ${res.statusText}`)
    }

    const body = (await res.json()) as ArbeitnowResponse
    let jobs = body.data ?? []

    if (query.remoteOnly) {
      jobs = jobs.filter((j) => j.remote)
    }
    if (query.location) {
      const needle = query.location.toLowerCase()
      jobs = jobs.filter((j) => j.location?.toLowerCase().includes(needle))
    }
    if (query.limit) {
      jobs = jobs.slice(0, query.limit)
    }

    return jobs.map(
      (j): RawJob => ({
        externalId: j.slug,
        source: 'arbeitnow',
        title: j.title,
        company: j.company_name,
        location: j.location || (j.remote ? 'Remote' : undefined),
        remote: j.remote,
        workplaceType: j.remote ? 'remote' : 'office',
        url: j.url,
        description: j.description,
        tags: [...(j.tags ?? []), ...(j.job_types ?? [])],
        postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : undefined,
      }),
    )
  },
}
