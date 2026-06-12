import { type NextRequest } from 'next/server'
import { setProjectVisibility } from '@/lib/projects/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// id is the GitHub repo id (Project.id === String(githubId)).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const githubId = Number(id)
  const body = await request.json().catch(() => null)
  if (Number.isNaN(githubId) || !body || typeof body.visible !== 'boolean') {
    return Response.json({ error: 'numeric id and visible (boolean) required' }, { status: 400 })
  }
  const result = await setProjectVisibility(githubId, body.visible)
  return Response.json({ project: result })
}
