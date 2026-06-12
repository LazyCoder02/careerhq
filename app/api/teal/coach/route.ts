import { type NextRequest } from 'next/server'
import { getCoaching } from '@/lib/teal/coach'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// The Claude call can take 10-30s; keep headroom over the default function limit.
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get('refresh') === '1'
  const result = await getCoaching({ refresh })
  return Response.json(result)
}
