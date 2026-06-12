import { type NextRequest } from 'next/server'
import { getResumes, createVersion, getMaster } from '@/lib/resumes/store'
import { getJob } from '@/lib/jobs/store'
import { findSkillsInText } from '@/lib/jobs/skills'
import { tailorResume } from '@/lib/teal/tailor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// AI tailoring calls Claude; give it headroom.
export const maxDuration = 60

export async function GET() {
  const resumes = await getResumes()
  return Response.json({ count: resumes.length, resumes })
}

/**
 * Create a job-tailored version of the master CV.
 * Body: { label, jobId? | (jobDescription + jobTitle?) , jobUrl? }
 * Resolves job context (a scraped job by id, or a pasted description), then
 * tailors the master CV section-by-section.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.label !== 'string' || !body.label.trim()) {
    return Response.json({ error: 'label is required' }, { status: 400 })
  }

  const master = await getMaster()
  if (!master) {
    return Response.json({ error: 'upload a master CV first' }, { status: 409 })
  }

  // Resolve the job: a scraped posting by id, or a pasted description.
  let jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle : ''
  let jobUrl = typeof body.jobUrl === 'string' ? body.jobUrl : undefined
  let jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription : ''
  let jobSkills: string[] = []
  let linkedJobId: string | undefined

  if (typeof body.jobId === 'string') {
    const job = await getJob(body.jobId)
    if (job) {
      linkedJobId = job.id
      jobTitle ||= job.title
      jobUrl ||= job.url
      jobDescription ||= job.description || ''
      jobSkills = job.requiredSkills ?? []
    }
  }
  if (!jobSkills.length) jobSkills = findSkillsInText(`${jobTitle} ${jobDescription}`, [])

  if (!jobTitle && !jobDescription) {
    return Response.json({ error: 'provide a jobId or a job description' }, { status: 400 })
  }

  const tailored = await tailorResume({
    masterContent: master.content,
    jobTitle: jobTitle || 'this role',
    jobDescription,
    jobSkills,
  })

  const resume = await createVersion({
    label: body.label.trim(),
    linkedJobId,
    jobTitle: jobTitle || undefined,
    jobUrl,
    sections: tailored.sections,
    tailoredBy: tailored.tailoredBy,
  })
  return Response.json({ resume }, { status: 201 })
}
