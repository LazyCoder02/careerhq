import { type NextRequest } from 'next/server'
import { updateApplication, deleteApplication } from '@/lib/applications/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const patch = await request.json().catch(() => null)
  if (!patch || typeof patch !== 'object') {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }
  const application = await updateApplication(id, patch)
  if (!application) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json({ application })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ok = await deleteApplication(id)
  if (!ok) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json({ ok: true })
}
