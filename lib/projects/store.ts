import type { Project } from '@/types'
import { loadTable, saveTable } from '@/lib/store/json-table'
import { fetchGithubRepos, githubConfigured } from './github'

/**
 * Projects = live GitHub repos (lib/projects/github.ts) overlaid with the user's
 * persisted portfolio visibility choices. We only store the visibility overrides
 * locally (keyed by GitHub repo id); the repo data itself is always fresh from
 * GitHub. No GitHub configured → empty list and a "connect GitHub" empty state.
 */

const TABLE = 'project-visibility'

interface VisibilityOverride {
  githubId: number
  visible: boolean
}

export { githubConfigured }

export async function getProjects(): Promise<Project[]> {
  const repos = await fetchGithubRepos()
  if (!repos) return []
  const overrides = await loadTable<VisibilityOverride>(TABLE)
  const byId = new Map(overrides.map((o) => [o.githubId, o.visible]))
  return repos
    .map((p) => ({ ...p, visible: byId.get(p.githubId) ?? p.visible }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function setProjectVisibility(
  githubId: number,
  visible: boolean,
): Promise<{ githubId: number; visible: boolean }> {
  const overrides = await loadTable<VisibilityOverride>(TABLE)
  const idx = overrides.findIndex((o) => o.githubId === githubId)
  if (idx === -1) overrides.push({ githubId, visible })
  else overrides[idx].visible = visible
  await saveTable(TABLE, overrides)
  return { githubId, visible }
}
