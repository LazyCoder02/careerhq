import type { ReadinessData, SkillGap, ReadinessLevel } from '@/types'
import { getUserProfile } from '@/lib/profile'
import { getAllJobs } from '@/lib/jobs/store'

/**
 * Readiness, computed from the user's profile against *real* demand in the
 * ingested job store — replacing the hard-coded mockReadiness.
 *
 *  - `appearsIn`  → the share of stored postings that require each skill, so the
 *                   percentages reflect the jobs actually pulled by ingestion.
 *  - `score`      → demand-weighted coverage: of all the skill-demand across
 *                   listings, how much the user already holds (Strong = full
 *                   credit, Weak = partial, Missing/absent = none). A profile
 *                   that covers the most-demanded skills scores high.
 *  - `gaps`       → the most in-demand skills (plus anything in the profile),
 *                   each tagged with the user's current level, hardest gaps first.
 */

const LEVEL_WEIGHT: Record<ReadinessLevel, number> = {
  Strong: 1,
  Weak: 0.6,
  Missing: 0,
}

/** Order used when demand ties: surface the biggest gaps first. */
const LEVEL_RANK: Record<ReadinessLevel, number> = {
  Missing: 0,
  Weak: 1,
  Strong: 2,
}

const MAX_GAPS_SHOWN = 6

export async function computeReadiness(): Promise<ReadinessData> {
  const profile = await getUserProfile()
  const jobs = await getAllJobs()
  const total = jobs.length || 1

  // How often each skill is required across the store.
  const demand = new Map<string, number>()
  for (const job of jobs) {
    for (const skill of job.requiredSkills) {
      demand.set(skill, (demand.get(skill) ?? 0) + 1)
    }
  }

  // Demand-weighted coverage score over skills that actually appear in listings.
  let weighted = 0
  let totalDemand = 0
  for (const [skill, count] of demand) {
    const level = profile.skills[skill] ?? 'Missing'
    weighted += count * LEVEL_WEIGHT[level]
    totalDemand += count
  }
  const score = totalDemand === 0 ? 0 : Math.round((weighted / totalDemand) * 100)

  // Candidate skills: everything in demand, plus everything in the profile.
  const candidates = new Set<string>([...demand.keys(), ...Object.keys(profile.skills)])

  const gaps: SkillGap[] = [...candidates]
    .map((skill): SkillGap => {
      const level = profile.skills[skill] ?? 'Missing'
      const count = demand.get(skill) ?? 0
      return { skill, level, appearsIn: Math.round((count / total) * 100) }
    })
    // Show demanded skills and the user's known skills; drop noise (undemanded + unknown).
    .filter((g) => (g.appearsIn ?? 0) > 0 || profile.skills[g.skill])
    .sort(
      (a, b) =>
        (b.appearsIn ?? 0) - (a.appearsIn ?? 0) ||
        LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
        a.skill.localeCompare(b.skill),
    )
    .slice(0, MAX_GAPS_SHOWN)

  return { score, targetRole: profile.targetRole, gaps }
}
