import type { RawJob, JobSourceId, WorkplaceType } from '@/types/jobs'

/** Free-text + filters passed to a source. Sources honour what they can. */
export interface JobQuery {
  /** e.g. the user's target role — "Frontend Developer". */
  role?: string
  /** Location keyword; sources may ignore if they can't filter. */
  location?: string
  /** Country to restrict results to (e.g. "Poland"). */
  country?: string
  /** Workplace types to include. Empty/undefined == all. */
  workplaceTypes?: WorkplaceType[]
  remoteOnly?: boolean
  /** Soft cap on results to pull per run. */
  limit?: number
}

/**
 * A pluggable provider of job postings. The ingestion pipeline depends only on
 * this interface, so adding/removing a source never touches matching or storage.
 */
export interface JobSource {
  id: JobSourceId
  label: string
  /**
   * Whether this source is usable in the current environment (e.g. required
   * credentials are present). Disabled sources are skipped silently.
   */
  isEnabled(): boolean
  /** Fetch and lightly normalise postings. Should throw on hard failures. */
  fetch(query: JobQuery): Promise<RawJob[]>
}
