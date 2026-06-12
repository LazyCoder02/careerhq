import type { RawJob } from '@/types/jobs'
import type { JobSource, JobQuery } from './types'

/**
 * LinkedIn job source — DISABLED by default, and intentionally so.
 *
 * There is no public/free LinkedIn jobs API, and scraping the public job feed
 * violates LinkedIn's Terms of Service (and is legally contested). Do not put a
 * scraper here.
 *
 * To enable LinkedIn data legitimately you need ONE of:
 *   1. Official LinkedIn partner access (Talent Solutions / approved program), or
 *   2. A licensed third-party LinkedIn data provider that exposes an API and is
 *      contractually permitted to relay LinkedIn listings.
 *
 * When you have that, set the env vars below and implement `fetch()` to call your
 * provider and map its response onto `RawJob`. Nothing else in the pipeline changes.
 *
 *   LINKEDIN_PROVIDER_BASE_URL=...   # your licensed provider's API base
 *   LINKEDIN_PROVIDER_API_KEY=...    # credential issued by that provider
 */
export const linkedinSource: JobSource = {
  id: 'linkedin',
  label: 'LinkedIn',

  isEnabled() {
    return Boolean(
      process.env.LINKEDIN_PROVIDER_BASE_URL && process.env.LINKEDIN_PROVIDER_API_KEY,
    )
  },

  async fetch(_query: JobQuery): Promise<RawJob[]> {
    // Reaching here means credentials were provided but the adapter body is a stub.
    // Implement the call to your licensed provider and map results to RawJob.
    throw new Error(
      'LinkedIn source is configured but not implemented. ' +
        'Wire lib/jobs/sources/linkedin.ts to your licensed LinkedIn data provider.',
    )
  },
}
