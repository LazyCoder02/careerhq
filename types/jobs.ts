import type { ReadinessLevel } from '@/types'

/** How a role is worked. Used for the Poland + remote/hybrid/office filter. */
export type WorkplaceType = 'remote' | 'hybrid' | 'office'

/**
 * A job as returned by an external source, after only light normalisation.
 * Every `JobSource` adapter is responsible for mapping its provider's shape
 * onto this. Keep it provider-agnostic — no LinkedIn/Arbeitnow specifics leak past here.
 */
export interface RawJob {
  /** Stable id within the source (provider id, slug, or url hash). */
  externalId: string
  source: JobSourceId
  title: string
  company: string
  location?: string
  remote?: boolean
  /** remote / hybrid / office, when the source exposes it. */
  workplaceType?: WorkplaceType
  url: string
  /** Plain-text or HTML description; the matcher strips tags before scanning. */
  description: string
  /** Any tags/keywords the provider already attaches (skills, job types, etc.). */
  tags?: string[]
  /**
   * Structured required-skill names the provider supplies directly (e.g.
   * JustJoin.it's `requiredSkills`). When present these are authoritative and
   * preferred over scanning the description text. Free-form — canonicalised
   * against the skill catalog at storage time.
   */
  skills?: string[]
  /** ISO timestamp the job was posted, if the provider exposes one. */
  postedAt?: string
}

export type JobSourceId = 'justjoin' | 'arbeitnow' | 'linkedin'

/**
 * A normalised, stored job. This is `RawJob` plus the skills we extracted and
 * a synthetic stable `id` used as the storage key across ingestion runs.
 */
export interface JobPosting extends RawJob {
  /** `${source}:${externalId}` — stable across runs so re-ingesting upserts. */
  id: string
  /** Skills from the catalog detected in the posting. */
  requiredSkills: string[]
  firstSeenAt: string
  lastSeenAt: string
}

/**
 * How a job relates to the user's current aptitudes.
 * - READY   → the user already has the skills the job needs.
 * - STRETCH → there are gaps, but few and learnable enough to close *during*
 *             the application process. This is the "grow into it" bucket.
 * - REACH   → too many / too hard gaps to be realistic right now.
 */
export type MatchCategory = 'READY' | 'STRETCH' | 'REACH'

export interface MatchedSkill {
  skill: string
  /** The user's current level for this skill, if known. */
  level: ReadinessLevel
}

/** A job paired with the result of scoring it against the user's profile. */
export interface JobMatch {
  job: JobPosting
  /** 0–100. Weighted proportion of required skills the user already holds. */
  matchScore: number
  category: MatchCategory
  /** Required skills the user already has (Strong/Weak). */
  matchedSkills: MatchedSkill[]
  /** Required skills the user is missing. */
  missingSkills: string[]
  /** Subset of `missingSkills` realistically acquirable during the application. */
  learnableSkills: string[]
  readyToApply: boolean
  /** Number of gaps to close before applying (== missingSkills.length). */
  gapsToClose: number
  /** Short human-readable explanation of the classification. */
  reason: string
}
