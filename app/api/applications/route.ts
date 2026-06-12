import { type NextRequest } from 'next/server'
import { getApplications, createApplication } from '@/lib/applications/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const applications = await getApplications()
  return Response.json({ count: applications.length, applications })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.company !== 'string' || typeof body.role !== 'string') {
    return Response.json({ error: 'company and role are required' }, { status: 400 })
  }
  const application = await createApplication({
    company: body.company,
    role: body.role,
    status: body.status,
    location: body.location,
    notes: body.notes,
    cvVersionId: body.cvVersionId,
    matchScore: body.matchScore,
    readyToApply: body.readyToApply,
    gapsToClose: body.gapsToClose,
  })
  return Response.json({ application }, { status: 201 })
}
