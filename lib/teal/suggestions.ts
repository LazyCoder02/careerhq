import type { ReadinessData, TealTaskSuggestion } from '@/types'
import { isLearnable } from '@/lib/jobs/skills'

/**
 * Rules-based "what to do next" suggestions, derived from the readiness gaps.
 *
 * This is the NON-AI placeholder: deterministic templates keyed off the user's
 * weakest, most in-demand skills. The final step swaps this for a model call
 * (the Teal AI), which can keep the same return shape so the UI never changes.
 */

interface Template {
  title: string
  description: string
  timeEstimate: string
  freelancePlatform?: string
  freelanceRate?: string
}

/** Per-skill advice. Anything without an entry falls back to a generic template. */
const TEMPLATES: Record<string, Template> = {
  Docker: {
    title: 'Containerise an app with Docker',
    description:
      'Add a Dockerfile to one of your projects and push it. Closes the Docker gap and is visible portfolio signal.',
    timeEstimate: '~1 day',
    freelancePlatform: 'Upwork',
    freelanceRate: '$80–120',
  },
  Testing: {
    title: 'Add a test suite to an existing project',
    description:
      'Pick a repo and add Vitest/Jest unit tests. No new project needed — just evidence you can test code.',
    timeEstimate: '~half a day',
  },
  'REST API design': {
    title: 'Build a small REST API with auth',
    description:
      'A Node + Express API with JWT auth closes the REST gap and doubles as a portfolio piece.',
    timeEstimate: '~2 days',
    freelancePlatform: 'Fiverr',
    freelanceRate: '$60–100',
  },
  TypeScript: {
    title: 'Convert a JS project to TypeScript',
    description: 'Migrate an existing project to TS to demonstrate type-safe, production-grade code.',
    timeEstimate: '~1 day',
  },
  GraphQL: {
    title: 'Expose a GraphQL endpoint',
    description: 'Wrap an existing data source in a small GraphQL schema to show API-design range.',
    timeEstimate: '~1 day',
  },
}

function priorityFor(level: string, appearsIn: number): TealTaskSuggestion['priority'] {
  if (level === 'Missing' && appearsIn >= 50) return 'high'
  if (level === 'Missing' || appearsIn >= 50) return 'medium'
  return 'low'
}

export function buildTaskSuggestions(readiness: ReadinessData, limit = 3): TealTaskSuggestion[] {
  return readiness.gaps
    .filter((g) => g.level !== 'Strong')
    // Address the most in-demand gaps first; prefer ones learnable during an application.
    .sort(
      (a, b) =>
        Number(isLearnable(b.skill)) - Number(isLearnable(a.skill)) ||
        (b.appearsIn ?? 0) - (a.appearsIn ?? 0),
    )
    .slice(0, limit)
    .map((gap): TealTaskSuggestion => {
      const t = TEMPLATES[gap.skill]
      const appearsIn = gap.appearsIn ?? 0
      const base: TealTaskSuggestion = t
        ? {
            title: t.title,
            description: t.description,
            skill: `${gap.skill} · ${gap.level.toLowerCase()}`,
            priority: priorityFor(gap.level, appearsIn),
            timeEstimate: t.timeEstimate,
            freelanceAvailable: Boolean(t.freelancePlatform),
            freelancePlatform: t.freelancePlatform,
            freelanceRate: t.freelanceRate,
          }
        : {
            title: `Build something that uses ${gap.skill}`,
            description: `${gap.skill} appears in ${appearsIn}% of your target listings and you're currently ${gap.level.toLowerCase()}. A small project closes the gap.`,
            skill: `${gap.skill} · ${gap.level.toLowerCase()}`,
            priority: priorityFor(gap.level, appearsIn),
            timeEstimate: '~1 day',
            freelanceAvailable: false,
          }
      return base
    })
}
