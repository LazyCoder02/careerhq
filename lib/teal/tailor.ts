import type { CVSection } from '@/types'
import { hasAnthropicKey, callClaude, parseJsonFromModel } from './claude'
import { findSkillsInText } from '@/lib/jobs/skills'

/**
 * Produce a job-tailored CV from the master CV. The model only reorganises and
 * re-emphasises what's already in the master (it's instructed not to invent
 * experience), returning per-section content (About Me, Skills, Projects,
 * Experience) plus a note on what changed for this job.
 *
 * Falls back to a deterministic heuristic when ANTHROPIC_API_KEY is absent, so
 * a version is always created — it just won't be as polished.
 */

export interface TailorInput {
  masterContent: string
  jobTitle: string
  jobDescription: string
  /** Skills the job requires (from the scraped posting or parsed JD). */
  jobSkills: string[]
}

export interface TailorResult {
  sections: CVSection[]
  tailoredBy: 'claude' | 'heuristic'
}

const SYSTEM = `You tailor a candidate's master CV to one specific job for an early-career software-engineering / internship application.

Hard rules:
- Truthful only: reorganise, re-emphasise and reword what's already in the master CV. NEVER invent employers, projects, dates, or skills the candidate doesn't have.
- Surface the experience and skills most relevant to this job first.
- Keep it concise and ATS-friendly (mirror the job's wording for skills the candidate genuinely has).

Respond with STRICT JSON only (no markdown):
{
  "sections": [
    {"heading": "About Me", "content": "tailored summary", "note": "what you changed for this job"},
    {"heading": "Skills", "content": "reordered/emphasised skills", "note": "..."},
    {"heading": "Projects", "content": "most relevant projects first", "note": "..."},
    {"heading": "Experience", "content": "...", "note": "..."}
  ]
}
Only include sections that exist in the master CV. 3-5 sections.`

function buildPrompt(input: TailorInput): string {
  return `TARGET JOB: ${input.jobTitle}
JOB REQUIRES: ${input.jobSkills.join(', ') || '(not specified)'}

JOB DESCRIPTION:
${input.jobDescription.slice(0, 4000) || '(none provided)'}

CANDIDATE'S MASTER CV:
${input.masterContent.slice(0, 6000) || '(empty)'}

Tailor the master CV to this job and return the JSON.`
}

interface ModelShape {
  sections: Array<{ heading: string; content: string; note?: string }>
}

function heuristic(input: TailorInput): TailorResult {
  const cvSkills = findSkillsInText(input.masterContent, [])
  const overlap = cvSkills.filter((s) => input.jobSkills.includes(s))
  const others = cvSkills.filter((s) => !input.jobSkills.includes(s))
  const note = 'Heuristic tailoring — add ANTHROPIC_API_KEY for full AI rewrite.'

  const sections: CVSection[] = [
    {
      heading: 'About Me',
      content: `Aspiring ${input.jobTitle} with hands-on experience in ${overlap.slice(0, 4).join(', ') || cvSkills.slice(0, 4).join(', ') || 'software development'}.`,
      note: `Reframed your summary around the ${input.jobTitle} target.`,
    },
    {
      heading: 'Skills',
      content: [...overlap, ...others].join(', ') || '(no skills detected in master CV)',
      note: overlap.length
        ? `Moved ${overlap.join(', ')} to the front — these match the posting.`
        : note,
    },
    {
      heading: 'Original CV (reference)',
      content: input.masterContent.slice(0, 4000),
      note,
    },
  ]
  return { sections, tailoredBy: 'heuristic' }
}

export async function tailorResume(input: TailorInput): Promise<TailorResult> {
  if (!hasAnthropicKey()) return heuristic(input)
  try {
    const raw = await callClaude({ system: SYSTEM, prompt: buildPrompt(input), maxTokens: 2500 })
    const parsed = parseJsonFromModel<ModelShape>(raw)
    const sections = (parsed.sections ?? [])
      .filter((s) => s.heading && s.content)
      .slice(0, 6)
      .map((s): CVSection => ({ heading: s.heading, content: s.content, note: s.note }))
    if (!sections.length) return heuristic(input)
    return { sections, tailoredBy: 'claude' }
  } catch {
    return heuristic(input)
  }
}
