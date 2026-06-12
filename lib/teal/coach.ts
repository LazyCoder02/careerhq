import type {
  TealCoaching,
  TealSkillToAcquire,
  TealResumeSuggestion,
  TealPractice,
  TealFreelanceItem,
} from '@/types'
import { getUserProfile } from '@/lib/profile'
import { getAllJobs } from '@/lib/jobs/store'
import { matchJob } from '@/lib/jobs/matching'
import { loadTable, saveTable } from '@/lib/store/json-table'
import { hasAnthropicKey, callClaude, parseJsonFromModel } from './claude'
import { freelanceUrl, practiceUrl } from '@/lib/freelance'

/**
 * Teal's coaching engine. Looks at the user's CV-derived skills, their target
 * (a software-engineering / backend-Java internship), and the most recently
 * scraped jobs, then produces: skills worth acquiring that recur across those
 * jobs, concrete resume edits, a LeetCode/HackerRank practice plan, and
 * freelance gigs to build experience.
 *
 * Uses Claude when ANTHROPIC_API_KEY is set; otherwise returns a deterministic
 * fallback built from the same computed signals, so the feature degrades
 * gracefully rather than disappearing. Results are cached per (jobs+profile)
 * so we don't spend an API call on every page view — pass refresh to force.
 */

const JOBS_CONSIDERED = 3
const CACHE_TABLE = 'teal-coaching'

interface ConsideredJob {
  title: string
  company: string
  requiredSkills: string[]
  matchScore: number
}

interface SkillSignal {
  skill: string
  /** How many of the considered jobs require it. */
  count: number
  held: boolean
}

/** The most recently scraped jobs and the demand signal across them. */
async function gatherContext() {
  const profile = await getUserProfile()
  const allJobs = await getAllJobs()

  // "The latest run": most recently first-seen postings.
  const recent = [...allJobs]
    .sort((a, b) => (b.firstSeenAt ?? '').localeCompare(a.firstSeenAt ?? ''))
    .slice(0, JOBS_CONSIDERED)

  const jobs: ConsideredJob[] = recent.map((j) => ({
    title: j.title,
    company: j.company,
    requiredSkills: j.requiredSkills,
    matchScore: matchJob(j, profile).matchScore,
  }))

  // Skill frequency across the considered jobs.
  const counts = new Map<string, number>()
  for (const j of jobs) {
    for (const s of new Set(j.requiredSkills)) counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  const signals: SkillSignal[] = [...counts.entries()]
    .map(([skill, count]) => ({ skill, count, held: profile.skills[skill] === 'Strong' }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))

  return { profile, jobs, signals }
}

type Ctx = Awaited<ReturnType<typeof gatherContext>>

function targetRoleOf(ctx: Ctx): string {
  return ctx.profile.targetRole || 'a software engineering / backend (Java) internship'
}

// ---- Claude path -----------------------------------------------------------

const SYSTEM = `You are Teal, a sharp, practical AI career coach for early-career software engineers applying to internships. Give specific, internship-level advice — assume the user is a student/new-grad targeting their first or second role. Be concrete and encouraging without fluff.

Respond with STRICT JSON only (no markdown, no prose outside the object) matching exactly:
{
  "summary": "2-3 sentence read on where they stand for this target",
  "skillsToAcquire": [{"skill": "string", "rationale": "1-2 sentences tying it to the target + the scraped jobs", "priority": "high|medium|low"}],
  "resumeSuggestions": [{"section": "e.g. Skills/Projects/Summary/Experience", "change": "a concrete edit"}],
  "practice": [{"platform": "LeetCode|HackerRank", "focus": "short comma-separated topics relevant to the target"}],
  "freelance": [{"title": "gig idea", "skill": "string", "platform": "Upwork|Fiverr|Freelancer|Toptal", "query": "short search query", "rate": "rough $ range"}]
}
Pick skills that recur across the provided jobs and matter for the target. 4-6 skills, 3-5 resume suggestions, 1-2 practice items, 2-4 freelance items.`

function buildPrompt(ctx: Ctx): string {
  const held = Object.keys(ctx.profile.skills).filter((s) => ctx.profile.skills[s] === 'Strong')
  const jobLines = ctx.jobs
    .map((j, i) => `${i + 1}. ${j.title} @ ${j.company} — requires: ${j.requiredSkills.join(', ') || '(none parsed)'}`)
    .join('\n')
  const common = ctx.signals
    .filter((s) => !s.held && s.count >= 1)
    .map((s) => `${s.skill} (in ${s.count}/${ctx.jobs.length} jobs)`)
    .join(', ')

  return `Target role: ${targetRoleOf(ctx)}
Skills already on the candidate's CV: ${held.join(', ') || '(none detected yet)'}

The ${ctx.jobs.length} most recently scraped jobs:
${jobLines}

Skills that recur across these jobs and the candidate does NOT yet have: ${common || '(none — candidate covers the common requirements)'}

Produce the JSON coaching object. Ground "skillsToAcquire" in the recurring skills above; prioritise ones appearing in more of the jobs. Practice topics should target software-engineering internship interviews (data structures & algorithms, and Java where relevant).`
}

interface ModelShape {
  summary: string
  skillsToAcquire: Array<{ skill: string; rationale: string; priority: string }>
  resumeSuggestions: Array<{ section: string; change: string }>
  practice: Array<{ platform: string; focus: string }>
  freelance: Array<{ title: string; skill: string; platform: string; query: string; rate?: string }>
}

function countFor(ctx: Ctx, skill: string): number {
  return ctx.signals.find((s) => s.skill.toLowerCase() === skill.toLowerCase())?.count ?? 0
}

function normalisePriority(p: string): 'high' | 'medium' | 'low' {
  return p === 'high' || p === 'low' ? p : 'medium'
}

function fromModel(ctx: Ctx, m: ModelShape): TealCoaching {
  const skillsToAcquire: TealSkillToAcquire[] = (m.skillsToAcquire ?? []).slice(0, 6).map((s) => ({
    skill: s.skill,
    rationale: s.rationale,
    appearsInJobs: countFor(ctx, s.skill), // authoritative count from our data
    priority: normalisePriority(s.priority),
  }))
  const resumeSuggestions: TealResumeSuggestion[] = (m.resumeSuggestions ?? []).slice(0, 5)
  const practice: TealPractice[] = (m.practice ?? []).slice(0, 2).map((p) => ({
    platform: p.platform,
    focus: p.focus,
    url: practiceUrl(p.platform, p.focus), // URL built in code, never trusted from model
  }))
  const freelance: TealFreelanceItem[] = (m.freelance ?? []).slice(0, 4).map((f) => ({
    title: f.title,
    skill: f.skill,
    platform: f.platform,
    rate: f.rate,
    url: freelanceUrl(f.platform, f.query || f.skill),
  }))
  return {
    generatedAt: new Date().toISOString(),
    source: 'claude',
    targetRole: targetRoleOf(ctx),
    jobsConsidered: ctx.jobs.length,
    summary: m.summary,
    skillsToAcquire,
    resumeSuggestions,
    practice,
    freelance,
  }
}

// ---- Deterministic fallback (no key / API error) ---------------------------

function fallback(ctx: Ctx): TealCoaching {
  const target = targetRoleOf(ctx)
  const missing = ctx.signals.filter((s) => !s.held)
  const top = missing.slice(0, 5)

  const skillsToAcquire: TealSkillToAcquire[] = top.map((s) => ({
    skill: s.skill,
    rationale: `Appears in ${s.count} of your ${ctx.jobs.length} latest scraped roles and you don't have it yet — closing it lifts you past those listings.`,
    appearsInJobs: s.count,
    priority: s.count >= ctx.jobs.length ? 'high' : s.count >= 2 ? 'medium' : 'low',
  }))

  const topSkill = top[0]?.skill
  const resumeSuggestions: TealResumeSuggestion[] = [
    { section: 'Skills', change: `List the tools these roles share that you already use, near the top, exactly as written in the postings (ATS reads literal matches).` },
    topSkill
      ? { section: 'Projects', change: `Add or extend a project that demonstrates ${topSkill}, and link the repo — it's the most common gap across these jobs.` }
      : { section: 'Projects', change: 'Add a project with a public repo link that mirrors the stacks in these postings.' },
    { section: 'Summary', change: `Open with one line naming the target ("${target}") and your strongest 2-3 matching skills.` },
    { section: 'Experience', change: 'Rewrite bullets as "Did X using Y, achieving Z" with a number in each — impact over duties.' },
  ]

  const practice: TealPractice[] = [
    { platform: 'LeetCode', focus: 'Arrays & Hashing, Two Pointers, Trees, Graphs', url: practiceUrl('LeetCode', 'arrays') },
    { platform: 'HackerRank', focus: 'Java, Data Structures, Problem Solving', url: practiceUrl('HackerRank', 'java') },
  ]

  const freelanceSeeds = (top.length ? top : ctx.signals).slice(0, 3)
  const platforms = ['Upwork', 'Fiverr', 'Freelancer']
  const freelance: TealFreelanceItem[] = freelanceSeeds.map((s, i) => ({
    title: `Small ${s.skill} task to build a portfolio piece`,
    skill: s.skill,
    platform: platforms[i % platforms.length],
    rate: '$15–40/hr (entry)',
    url: freelanceUrl(platforms[i % platforms.length], `${s.skill} junior`),
  }))

  return {
    generatedAt: new Date().toISOString(),
    source: 'fallback',
    targetRole: target,
    jobsConsidered: ctx.jobs.length,
    summary: `Based on your ${ctx.jobs.length} latest scraped roles for ${target}, here are the recurring skills to close, where to tighten your CV, and how to prep. Add an ANTHROPIC_API_KEY to get Teal's full AI coaching.`,
    skillsToAcquire,
    resumeSuggestions,
    practice,
    freelance,
  }
}

// ---- Public API ------------------------------------------------------------

function cacheKey(ctx: Ctx): string {
  const jobs = ctx.jobs.map((j) => j.title + '@' + j.company).sort().join('|')
  const skills = Object.keys(ctx.profile.skills).sort().join(',')
  return `${ctx.profile.targetRole}::${skills}::${jobs}::${hasAnthropicKey() ? 'ai' : 'fb'}`
}

interface CacheRow {
  key: string
  coaching: TealCoaching
}

export interface CoachResult {
  /** Fewer than 3 jobs scraped yet — UI shows a "waiting for jobs" state. */
  ready: boolean
  jobsConsidered: number
  coaching: TealCoaching | null
}

export async function getCoaching(options: { refresh?: boolean } = {}): Promise<CoachResult> {
  const ctx = await gatherContext()

  if (ctx.jobs.length < JOBS_CONSIDERED) {
    return { ready: false, jobsConsidered: ctx.jobs.length, coaching: null }
  }

  const key = cacheKey(ctx)
  if (!options.refresh) {
    const cached = await loadTable<CacheRow>(CACHE_TABLE)
    const hit = cached.find((r) => r.key === key)
    if (hit) return { ready: true, jobsConsidered: ctx.jobs.length, coaching: hit.coaching }
  }

  let coaching: TealCoaching
  if (hasAnthropicKey()) {
    try {
      const raw = await callClaude({ system: SYSTEM, prompt: buildPrompt(ctx) })
      coaching = fromModel(ctx, parseJsonFromModel<ModelShape>(raw))
    } catch {
      coaching = fallback(ctx) // network/parse failure -> deterministic plan
    }
  } else {
    coaching = fallback(ctx)
  }

  await saveTable<CacheRow>(CACHE_TABLE, [{ key, coaching }])
  return { ready: true, jobsConsidered: ctx.jobs.length, coaching }
}
