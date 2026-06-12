import { type NextRequest } from 'next/server'
import { saveMaster } from '@/lib/resumes/store'
import { extractCvText } from '@/lib/cv/extract'
import { applyCvSkills, setTargetRole, setName } from '@/lib/profile/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Upload (or replace) the master CV. Extracts text -> derives profile skills.
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!form || !(file instanceof File)) {
    return Response.json({ error: 'multipart form with a "file" field is required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const content = await extractCvText(buffer, file.name)
  const master = await saveMaster({ fileName: file.name, fileBuffer: buffer, content })

  const profile = await applyCvSkills(content)
  const targetRole = form.get('targetRole')
  if (typeof targetRole === 'string' && targetRole.trim()) {
    await setTargetRole(targetRole)
  }
  const name = form.get('name')
  if (typeof name === 'string' && name.trim()) {
    await setName(name)
  }

  return Response.json({
    master,
    skillsFound: Object.keys(profile.skills).length,
    textExtracted: content.length > 0,
  }, { status: 201 })
}
