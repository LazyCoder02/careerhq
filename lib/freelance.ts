/**
 * Deterministic link builders for freelance platforms and coding-practice sites.
 *
 * The model decides *what* to suggest (a skill, a topic to drill); the actual
 * URLs are built here from a fixed template so links are always valid and never
 * hallucinated. Each is a search/listing URL, not a specific posting, so they
 * keep working over time.
 */

const FREELANCE_BUILDERS: Record<string, (q: string) => string> = {
  Upwork: (q) => `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(q)}`,
  Fiverr: (q) => `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(q)}`,
  Freelancer: (q) => `https://www.freelancer.com/jobs/?keyword=${encodeURIComponent(q)}`,
  Toptal: (q) => `https://www.toptal.com/freelance-jobs?keywords=${encodeURIComponent(q)}`,
}

export const FREELANCE_PLATFORMS = Object.keys(FREELANCE_BUILDERS)

/** Build a freelance search URL; falls back to Upwork for an unknown platform. */
export function freelanceUrl(platform: string, query: string): string {
  const build = FREELANCE_BUILDERS[platform] ?? FREELANCE_BUILDERS.Upwork
  return build(query)
}

// Map a free-text focus area onto a valid LeetCode topic tag where we can,
// otherwise link to the full problem set. Keeps every CTA a working link.
const LEETCODE_TAGS: Record<string, string> = {
  array: 'array', arrays: 'array', string: 'string', strings: 'string',
  'hash table': 'hash-table', hashing: 'hash-table', 'two pointers': 'two-pointers',
  tree: 'tree', trees: 'tree', graph: 'graph', graphs: 'graph',
  'dynamic programming': 'dynamic-programming', dp: 'dynamic-programming',
  'linked list': 'linked-list', stack: 'stack', queue: 'queue',
  recursion: 'recursion', backtracking: 'backtracking', sorting: 'sorting',
  'binary search': 'binary-search', greedy: 'greedy', heap: 'heap',
}

export function leetcodeUrl(focus: string): string {
  const key = focus.toLowerCase()
  for (const [term, slug] of Object.entries(LEETCODE_TAGS)) {
    if (key.includes(term)) return `https://leetcode.com/tag/${slug}/`
  }
  return 'https://leetcode.com/problemset/'
}

const HACKERRANK_DOMAINS: Record<string, string> = {
  java: 'java', python: 'python', sql: 'sql', algorithm: 'algorithms',
  algorithms: 'algorithms', 'data structure': 'data-structures',
  'data structures': 'data-structures', 'problem solving': 'algorithms',
}

export function hackerrankUrl(focus: string): string {
  const key = focus.toLowerCase()
  for (const [term, slug] of Object.entries(HACKERRANK_DOMAINS)) {
    if (key.includes(term)) return `https://www.hackerrank.com/domains/${slug}`
  }
  return 'https://www.hackerrank.com/dashboard'
}

/** Build a practice CTA URL for a given platform + focus area. */
export function practiceUrl(platform: string, focus: string): string {
  const p = platform.toLowerCase()
  if (p.includes('hackerrank')) return hackerrankUrl(focus)
  return leetcodeUrl(focus)
}
