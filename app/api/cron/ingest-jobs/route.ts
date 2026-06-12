import { type NextRequest } from 'next/server'
import { runIngestion } from '@/lib/jobs/ingest'

// Needs the Node runtime (filesystem store) and must never be cached/prerendered.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Apify sources run synchronously and can take minutes; without this the
// platform's default function timeout would kill the run mid-scrape. 300s is
// the ceiling on Vercel's Pro plan — keep this >= each Apify source's timeout.
export const maxDuration = 300

/**
 * Scheduled job-ingestion endpoint. Triggered every 6 hours by Vercel Cron
 * (see vercel.json). Vercel automatically attaches `Authorization: Bearer
 * $CRON_SECRET` to cron invocations, so we gate on that. For manual/local runs
 * you can pass `?secret=<CRON_SECRET>` instead.
 *
 * If CRON_SECRET is unset, the endpoint is only open in development.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorised(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await runIngestion(new Date().toISOString())
    return Response.json({ ok: true, ...summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ingestion failed'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

function isAuthorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured: allow only outside production to avoid an open endpoint.
    return process.env.NODE_ENV !== 'production'
  }
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  return request.nextUrl.searchParams.get('secret') === secret
}
