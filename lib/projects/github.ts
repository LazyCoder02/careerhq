import type { Project } from '@/types'

/**
 * Pulls the user's public repositories from the GitHub REST API and maps them
 * onto our Project shape. Configured by env:
 *
 *   GITHUB_USERNAME  required — the account whose repos to show
 *   GITHUB_TOKEN     optional — a PAT; raises the rate limit (60→5000/hr) and
 *                    lets private repos through. Sent as a Bearer header.
 *
 * No username configured → returns null, and the UI shows a "connect GitHub"
 * empty state instead of an error.
 */

interface GithubRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  language: string | null
  topics?: string[]
  updated_at: string
  fork: boolean
  archived: boolean
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_USERNAME)
}

export async function fetchGithubRepos(): Promise<Project[] | null> {
  const username = process.env.GITHUB_USERNAME
  if (!username) return null

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'careerhq',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
    { headers, cache: 'no-store' },
  )
  if (!res.ok) {
    throw new Error(`GitHub API responded ${res.status} for user ${username}`)
  }

  const repos = (await res.json()) as GithubRepo[]
  return repos
    .filter((r) => !r.fork && !r.archived)
    .map(
      (r): Project => ({
        id: String(r.id),
        githubId: r.id,
        name: r.name,
        description: r.description ?? undefined,
        url: r.html_url,
        languages: [r.language, ...(r.topics ?? [])].filter(Boolean) as string[],
        visible: true, // default; overridden by persisted preferences in the store
        updatedAt: r.updated_at.slice(0, 10),
      }),
    )
}
