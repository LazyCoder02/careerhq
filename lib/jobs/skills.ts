/**
 * Skill catalog used to extract required skills from free-text job postings
 * and to decide which gaps are realistically closeable *during* an application.
 *
 * `learnable: true` means a motivated candidate can pick up enough of the skill
 * to be credible within the window of an application process (days, not months)
 * — typically tooling/config skills. `learnable: false` skills are deeper
 * competencies (a language, a paradigm) that gate the "STRETCH" classification.
 */
export interface CatalogSkill {
  /** Canonical display name. */
  name: string
  /** Lowercased alternates matched in text (the canonical name is added automatically). */
  aliases?: string[]
  learnable: boolean
}

export const SKILL_CATALOG: CatalogSkill[] = [
  { name: 'TypeScript', aliases: ['ts'], learnable: false },
  { name: 'JavaScript', aliases: ['js', 'ecmascript'], learnable: false },
  { name: 'React', aliases: ['react.js', 'reactjs'], learnable: false },
  { name: 'Next.js', aliases: ['nextjs', 'next js'], learnable: true },
  { name: 'Vue', aliases: ['vue.js', 'vuejs'], learnable: false },
  { name: 'Angular', learnable: false },
  { name: 'Node.js', aliases: ['nodejs', 'node'], learnable: false },
  { name: 'HTML', aliases: ['html5'], learnable: true },
  { name: 'CSS', aliases: ['css3'], learnable: true },
  { name: 'Tailwind', aliases: ['tailwindcss', 'tailwind css'], learnable: true },
  { name: 'Testing', aliases: ['vitest', 'jest', 'unit testing', 'unit tests', 'cypress', 'playwright'], learnable: true },
  { name: 'Docker', aliases: ['containerisation', 'containerization', 'containers'], learnable: true },
  { name: 'Kubernetes', aliases: ['k8s'], learnable: false },
  { name: 'REST API design', aliases: ['rest', 'rest api', 'rest apis', 'restful'], learnable: true },
  { name: 'GraphQL', learnable: true },
  { name: 'PostgreSQL', aliases: ['postgres', 'postgresql', 'sql'], learnable: false },
  { name: 'MongoDB', aliases: ['mongo'], learnable: true },
  { name: 'AWS', aliases: ['amazon web services'], learnable: false },
  { name: 'Git', aliases: ['github', 'version control'], learnable: true },
  { name: 'CI/CD', aliases: ['ci/cd', 'continuous integration', 'github actions'], learnable: true },
  { name: 'Python', learnable: false },
  { name: 'Java', learnable: false },
  { name: 'Go', aliases: ['golang'], learnable: false },
]

const CATALOG_BY_NAME = new Map(SKILL_CATALOG.map((s) => [s.name, s]))

/** Lowercased term (name or alias) -> canonical catalog name. */
const CANONICAL_BY_TERM = new Map<string, string>()
for (const skill of SKILL_CATALOG) {
  CANONICAL_BY_TERM.set(skill.name.toLowerCase(), skill.name)
  for (const alias of skill.aliases ?? []) CANONICAL_BY_TERM.set(alias.toLowerCase(), skill.name)
}

export function isLearnable(skillName: string): boolean {
  return CATALOG_BY_NAME.get(skillName)?.learnable ?? false
}

/**
 * Map a free-form skill string (e.g. from a provider's `requiredSkills`) onto
 * its canonical catalog name when it matches a known name or alias; otherwise
 * return the trimmed input unchanged. This keeps profile lookups consistent
 * ("nodejs" -> "Node.js") while still preserving skills outside our catalog.
 */
export function canonicalizeSkill(name: string): string {
  const key = name.trim().toLowerCase()
  return CANONICAL_BY_TERM.get(key) ?? name.trim()
}

/**
 * Build the regex term list for a skill: the canonical name plus aliases,
 * lowercased and regex-escaped. Used for whole-word matching against text.
 */
function termsFor(skill: CatalogSkill): string[] {
  return [skill.name.toLowerCase(), ...(skill.aliases ?? [])]
}

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Scan free text (and optional pre-tagged keywords) for catalog skills.
 * Matches on word boundaries so "react" doesn't hit "reactive", while still
 * allowing alias forms like "react.js". Returns canonical skill names, deduped.
 */
export function findSkillsInText(text: string, tags: string[] = []): string[] {
  const haystack = `${text} ${tags.join(' ')}`.toLowerCase()
  const found = new Set<string>()

  for (const skill of SKILL_CATALOG) {
    for (const term of termsFor(skill)) {
      const escaped = escapeRegex(term)
      // (?<![\w.+#-]) / (?![\w.+#-]) approximates a boundary that still allows
      // tech tokens like "node.js", "ci/cd", "c++" to match as whole terms.
      const re = new RegExp(`(?<![\\w.+#-])${escaped}(?![\\w.+#-])`, 'i')
      if (re.test(haystack)) {
        found.add(skill.name)
        break
      }
    }
  }

  return [...found]
}
