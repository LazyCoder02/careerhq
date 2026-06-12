import { runIngestion } from '@/lib/jobs/ingest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Apify sources run synchronously and can take a minute+; give it headroom.
export const maxDuration = 300

/**
 * Manual "scrape now" trigger for the Job Tracker button.
 *
 * Unlike /api/cron/ingest-jobs (which is gated by CRON_SECRET for the scheduled
 * run), this is meant to be called from the app UI, so it isn't secret-gated.
 * It runs the same ingestion pipeline and returns the summary. For a public
 * deployment you'd put this behind auth so it can't be hit to run up Apify cost.
 */
export async function POST() {
    try {
        const summary = await runIngestion(new Date().toISOString())
        return Response.json({ ok: true, ...summary })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Ingestion failed'
        return Response.json({ ok: false, error: message }, { status: 500 })
    }
}
