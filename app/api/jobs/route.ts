import { type NextRequest } from 'next/server'
import { getScoredMatches } from '@/lib/jobs/matches'
import { getUserProfile } from '@/lib/profile'
import type { JobMatch, MatchCategory } from '@/types/jobs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Read API for the Job Tracker UI. Returns every stored posting scored against
 * the user's current aptitudes, newest/best first.
 *
 * Query params:
 *   ?category=READY|STRETCH|REACH   filter to one bucket
 *   ?minScore=70                    only matches at/above this score
 *   ?limit=10                       cap the number returned
 */
export async function GET(request: NextRequest) {
  const profile = await getUserProfile()
  let matches: JobMatch[] = await getScoredMatches()

  const category = request.nextUrl.searchParams.get('category') as MatchCategory | null
  if (category) {
    matches = matches.filter((m) => m.category === category)
  }

  const minScore = Number(request.nextUrl.searchParams.get('minScore'))
  if (!Number.isNaN(minScore) && minScore > 0) {
    matches = matches.filter((m) => m.matchScore >= minScore)
  }

  const limit = Number(request.nextUrl.searchParams.get('limit'))
  if (!Number.isNaN(limit) && limit > 0) {
    matches = matches.slice(0, limit)
  }

  return Response.json({
    targetRole: profile.targetRole,
    count: matches.length,
    matches,
  })
}
