import type { ReadinessLevel } from '@/types'
import type { JobPosting, JobMatch, MatchCategory, MatchedSkill } from '@/types/jobs'
import type { UserProfile } from '@/lib/profile'
import { isLearnable } from './skills'

/**
 * Maximum number of missing skills a job can have and still be a STRETCH
 * (i.e. "you could close these during the application process"). Beyond this,
 * even all-learnable gaps make the job a REACH.
 */
const MAX_CLOSEABLE_GAPS = 2

/** How much credit each held-skill level contributes toward the match score. */
const LEVEL_WEIGHT: Record<ReadinessLevel, number> = {
  Strong: 1,
  Weak: 0.6,
  Missing: 0,
}

/**
 * Score a single job against the user's profile and classify it.
 *
 * Scoring: each required skill contributes 1 to the denominator; the user's
 * level in that skill contributes its weight to the numerator. A job needing
 * skills the user fully holds scores ~100; one full of gaps scores low.
 *
 * Classification:
 *   - READY   → no missing skills.
 *   - STRETCH → missing skills are few (<= MAX_CLOSEABLE_GAPS) and every one is
 *               learnable during the application — the "grow into it" bucket.
 *   - REACH   → otherwise.
 */
export function matchJob(job: JobPosting, profile: UserProfile): JobMatch {
  const required = job.requiredSkills
  const matchedSkills: MatchedSkill[] = []
  const missingSkills: string[] = []

  let earned = 0
  for (const skill of required) {
    const level = profile.skills[skill]
    if (level && level !== 'Missing') {
      matchedSkills.push({ skill, level })
      earned += LEVEL_WEIGHT[level]
    } else {
      // Missing from profile, or explicitly held at "Missing".
      missingSkills.push(skill)
    }
  }

  // With no recognised skills we can't judge fit — treat as a neutral 50.
  const matchScore = required.length === 0 ? 50 : Math.round((earned / required.length) * 100)

  const learnableSkills = missingSkills.filter(isLearnable)
  const category = classify(required.length, missingSkills, learnableSkills)

  return {
    job,
    matchScore,
    category,
    matchedSkills,
    missingSkills,
    learnableSkills,
    readyToApply: category === 'READY',
    gapsToClose: missingSkills.length,
    reason: buildReason(category, matchedSkills, missingSkills, learnableSkills),
  }
}

function classify(requiredCount: number, missing: string[], learnable: string[]): MatchCategory {
  // No recognised skills means we can't judge fit — not a match, just unknown.
  if (requiredCount === 0) return 'REACH'
  if (missing.length === 0) return 'READY'
  const allGapsLearnable = missing.length === learnable.length
  if (missing.length <= MAX_CLOSEABLE_GAPS && allGapsLearnable) return 'STRETCH'
  return 'REACH'
}

function buildReason(
  category: MatchCategory,
  matched: MatchedSkill[],
  missing: string[],
  learnable: string[],
): string {
  if (matched.length === 0 && missing.length === 0) {
    return 'No recognised skills in this posting — fit unknown.'
  }

  const strong = matched.filter((m) => m.level === 'Strong').map((m) => m.skill)
  const strongPart = strong.length ? `Strong ${list(strong)} fit.` : ''

  if (category === 'READY') {
    return `${strongPart} You already have everything this role asks for.`.trim()
  }
  if (category === 'STRETCH') {
    return `${strongPart} ${list(learnable)} ${missing.length === 1 ? 'is' : 'are'} the only gap${
      missing.length === 1 ? '' : 's'
    } — closeable while you apply.`.trim()
  }
  return `${strongPart} Currently ${missing.length} gaps away (${list(missing)}) — a longer-term target.`.trim()
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
