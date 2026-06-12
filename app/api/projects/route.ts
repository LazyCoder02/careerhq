import { getProjects, githubConfigured } from '@/lib/projects/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const configured = githubConfigured()
  if (!configured) return Response.json({ configured: false, count: 0, projects: [] })
  try {
    const projects = await getProjects()
    return Response.json({ configured: true, count: projects.length, projects })
  } catch (err) {
    return Response.json(
      { configured: true, count: 0, projects: [], error: err instanceof Error ? err.message : 'GitHub fetch failed' },
      { status: 502 },
    )
  }
}
