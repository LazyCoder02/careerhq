import { promises as fs } from 'node:fs'
import { type NextRequest } from 'next/server'
import { getResume, absoluteFilePath } from '@/lib/resumes/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Download the original uploaded file for a CV version (master only has one).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const cv = await getResume(id)
  if (!cv?.filePath) return Response.json({ error: 'no file for this version' }, { status: 404 })
  const bytes = await fs.readFile(absoluteFilePath(cv.filePath)).catch(() => null)
  if (!bytes) return Response.json({ error: 'file missing' }, { status: 404 })
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${cv.fileName ?? 'cv'}"`,
    },
  })
}
