import type { RawJob } from '@/types/jobs'
import type { JobSource, JobQuery } from './types'
import { runApifyActor, hasApifyToken } from './apify'

/**
 * JustJoin.it job source, via the Apify "Just Join IT Scraper" actor.
 *
 * JustJoin.it has no first-party public API, so we use Apify's pre-built,
 * documented actor: POST the actor input, get the scraped dataset back in one
 * synchronous call (see lib/jobs/sources/apify.ts). Requires an Apify account.
 *
 * Env:
 *   APIFY_TOKEN              required — your Apify API token (see apify.ts)
 *   APIFY_JUSTJOIN_ACTOR_ID  optional — defaults to trev0n~justjoinit-scraper
 *
 * Docs: https://apify.com/trev0n/justjoinit-scraper
 */

const DEFAULT_ACTOR_ID = 'trev0n~justjoinit-scraper'

/** JustJoin's `location` is a city slug, not a country. */
function isCountry(loc: string): boolean {
  return ['poland', 'polska'].includes(loc.trim().toLowerCase())
}
function toCitySlug(loc: string): string {
  return loc.trim().toLowerCase().replace(/\s+/g, '-')
}

/**
 * JustJoin filters by `category` (a tech bucket) or a short `keyword`. A full
 * role title matches nothing, so map the target role onto a known category when
 * we recognise the tech. 'javascript' is listed before 'java' so "javascript"
 * roles don't fall through to the Java bucket.
 */
const CATEGORY_TERMS: Array<[string, string]> = [
  ['javascript', 'javascript'], ['typescript', 'javascript'], ['react', 'javascript'],
  ['angular', 'javascript'], ['vue', 'javascript'], ['frontend', 'javascript'],
  ['front-end', 'javascript'], ['node', 'javascript'],
  ['java', 'java'], ['python', 'python'], ['php', 'php'], ['.net', 'net'], ['c#', 'net'],
  ['ruby', 'ruby'], ['golang', 'go'], ['scala', 'scala'], ['devops', 'devops'],
  ['data', 'data'], ['security', 'security'], ['testing', 'testing'], ['qa', 'testing'],
  ['mobile', 'mobile'], ['android', 'mobile'], ['ios', 'mobile'],
]
function roleToCategory(role?: string): string | undefined {
  if (!role) return undefined
  const r = role.toLowerCase()
  for (const [term, cat] of CATEGORY_TERMS) if (r.includes(term)) return cat
  // 'go' on its own is too ambiguous to substring-match; check word-boundary.
  if (/\bgo\b/.test(r)) return 'go'
  return undefined
}

/** A subset of the actor's dataset item — only the fields we consume. */
interface JustJoinItem {
  title: string
  companyName: string
  city?: string
  locations?: Array<{ city?: string; street?: string }>
  workplaceType?: string // 'remote' | 'hybrid' | 'office'
  experienceLevel?: string
  requiredSkills?: string[]
  niceToHaveSkills?: string[]
  jobUrl?: string
  slug?: string
  guid?: string
  description?: string
  publishedAt?: string
}

function actorId(): string {
  return process.env.APIFY_JUSTJOIN_ACTOR_ID || DEFAULT_ACTOR_ID
}

export const justjoinSource: JobSource = {
  id: 'justjoin',
  label: 'JustJoin.it',

  isEnabled() {
    return hasApifyToken()
  },

  async fetch(query: JobQuery): Promise<RawJob[]> {
    // Map our generic query onto the actor's input schema.
    const input: Record<string, unknown> = {
      maxItems: query.limit ?? 100,
      sortBy: 'published',
    }

    // location is a CITY slug (default "all-locations"). JustJoin is Poland-wide
    // already, so never send the country — only an explicit city narrows it.
    if (query.location && !isCountry(query.location)) {
      input.location = toCitySlug(query.location)
    }

    // Prefer the tech `category` derived from the role; fall back to a short
    // keyword. A long role title as a keyword matches nothing.
    const category = roleToCategory(query.role)
    if (category) {
      input.category = category
    } else if (query.role && query.role.trim().split(/\s+/).length <= 2) {
      input.keyword = query.role.trim()
    }

    if (query.workplaceTypes?.length) input.workplaceType = query.workplaceTypes
    else if (query.remoteOnly) input.workplaceType = ['remote']

    const items = await runApifyActor<JustJoinItem>({
      actorId: actorId(),
      input,
    })

    return items
      .filter((j) => j.title && j.companyName)
      .map((j): RawJob => {
        const externalId = j.guid || j.slug || j.jobUrl || `${j.companyName}-${j.title}`
        const skills = [...(j.requiredSkills ?? []), ...(j.niceToHaveSkills ?? [])]
        const workplaceType =
          j.workplaceType === 'remote' || j.workplaceType === 'hybrid' || j.workplaceType === 'office'
            ? j.workplaceType
            : undefined
        return {
          externalId,
          source: 'justjoin',
          title: j.title,
          company: j.companyName,
          location: j.city || j.locations?.[0]?.city || (workplaceType === 'remote' ? 'Remote' : undefined),
          remote: workplaceType === 'remote',
          workplaceType,
          url: j.jobUrl || (j.slug ? `https://justjoin.it/job-offer/${j.slug}` : ''),
          description: j.description ?? '',
          tags: [j.experienceLevel, j.workplaceType].filter(Boolean) as string[],
          skills,
          postedAt: j.publishedAt,
        }
      })
  },
}
