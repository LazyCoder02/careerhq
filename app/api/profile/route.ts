import { type NextRequest } from 'next/server'
import { getProfile, setTargetRole, setPreferences, setName } from '@/lib/profile/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const profile = await getProfile()
  return Response.json({ profile })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }
  if (typeof body.name === 'string') await setName(body.name)
  if (typeof body.targetRole === 'string') await setTargetRole(body.targetRole)
  if (body.preferences) await setPreferences(body.preferences)
  const profile = await getProfile()
  return Response.json({ profile })
}
