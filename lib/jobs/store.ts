import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { RawJob, JobPosting } from '@/types/jobs'
import { findSkillsInText, canonicalizeSkill } from './skills'

/**
 * Persistence for ingested job postings.
 *
 * This is a deliberately small JSON-file repository so the pipeline runs with
 * zero infra during early development. Every read/write goes through this
 * module, so swapping it for Prisma later means reimplementing these functions
 * — callers (ingest, API routes) don't change.
 */

const DATA_DIR = path.join(process.cwd(), '.data')
const STORE_PATH = path.join(DATA_DIR, 'jobs.json')

/** Strip HTML tags and collapse whitespace so skill extraction sees clean text. */
function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function readStore(): Promise<JobPosting[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    return JSON.parse(raw) as JobPosting[]
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}

async function writeStore(jobs: JobPosting[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(jobs, null, 2), 'utf8')
}

/** Normalise a RawJob into a stored JobPosting (id + extracted skills + timestamps). */
function normalise(raw: RawJob, now: string): JobPosting {
  const text = toPlainText(raw.description)
  // Structured skills the provider supplies directly (e.g. JustJoin.it's
  // `requiredSkills`) are authoritative — canonicalise them against the catalog.
  // We still scan title/description/tags and union the two, so sources without a
  // skills array (or with empty descriptions) degrade gracefully instead of
  // landing with zero required skills (which would force a REACH classification).
  const provided = (raw.skills ?? []).map(canonicalizeSkill).filter(Boolean)
  const scanned = findSkillsInText(`${raw.title} ${text}`, raw.tags)
  return {
    ...raw,
    id: `${raw.source}:${raw.externalId}`,
    requiredSkills: [...new Set([...provided, ...scanned])],
    firstSeenAt: now,
    lastSeenAt: now,
  }
}

/**
 * Insert new postings and refresh `lastSeenAt` on ones we've seen before
 * (keyed by `${source}:${externalId}`). Returns how many were new vs updated.
 */
export async function upsertJobs(
  raws: RawJob[],
  now: string,
): Promise<{ inserted: number; updated: number; total: number }> {
  const existing = await readStore()
  const byId = new Map(existing.map((j) => [j.id, j]))

  let inserted = 0
  let updated = 0

  for (const raw of raws) {
    const normalised = normalise(raw, now)
    const prev = byId.get(normalised.id)
    if (prev) {
      byId.set(normalised.id, { ...normalised, firstSeenAt: prev.firstSeenAt, lastSeenAt: now })
      updated++
    } else {
      byId.set(normalised.id, normalised)
      inserted++
    }
  }

  const merged = [...byId.values()]
  await writeStore(merged)
  return { inserted, updated, total: merged.length }
}

/** All stored postings, most recently seen first. */
export async function getAllJobs(): Promise<JobPosting[]> {
  const jobs = await readStore()
  return jobs.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
}

/** Look up a single stored posting by its `${source}:${externalId}` id. */
export async function getJob(id: string): Promise<JobPosting | null> {
  const jobs = await readStore()
  return jobs.find((j) => j.id === id) ?? null
}
