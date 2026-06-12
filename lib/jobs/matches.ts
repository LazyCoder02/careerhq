import type { JobMatch } from '@/types/jobs'
import { getAllJobs } from './store'
import { matchJob } from './matching'
import { getUserProfile } from '@/lib/profile'

/**
 * Every stored posting scored against the user's profile, best match first.
 * Single source of truth for "matches" — used by /api/jobs and by the
 * dashboard pages (Teal, Home) so they never diverge.
 */
export async function getScoredMatches(): Promise<JobMatch[]> {
  const profile = await getUserProfile()
  const jobs = await getAllJobs()
  return jobs.map((job) => matchJob(job, profile)).sort((a, b) => b.matchScore - a.matchScore)
}
