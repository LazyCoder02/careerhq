import type { JobApplication } from '@/types'
import { loadTable, saveTable, newId } from '@/lib/store/json-table'

/**
 * The user's tracked job applications (the Job Tracker pipeline). Distinct from
 * ingested job *postings* (lib/jobs) — those are discovered jobs; these are the
 * ones the user has chosen to act on.
 */

const TABLE = 'applications'

export async function getApplications(): Promise<JobApplication[]> {
  const rows = await loadTable<JobApplication>(TABLE)
  // Newest first.
  return [...rows].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
}

export interface NewApplication {
  company: string
  role: string
  status?: JobApplication['status']
  location?: string
  notes?: string
  cvVersionId?: string
  matchScore?: number
  readyToApply?: boolean
  gapsToClose?: number
}

export async function createApplication(input: NewApplication): Promise<JobApplication> {
  const rows = await loadTable<JobApplication>(TABLE)
  const app: JobApplication = {
    id: newId(),
    company: input.company,
    role: input.role,
    status: input.status ?? 'SAVED',
    location: input.location,
    notes: input.notes,
    cvVersionId: input.cvVersionId,
    appliedAt: new Date().toISOString().slice(0, 10),
    matchScore: input.matchScore,
    readyToApply: input.readyToApply ?? false,
    gapsToClose: input.gapsToClose,
  }
  rows.push(app)
  await saveTable(TABLE, rows)
  return app
}

export async function updateApplication(
  id: string,
  patch: Partial<JobApplication>,
): Promise<JobApplication | null> {
  const rows = await loadTable<JobApplication>(TABLE)
  const idx = rows.findIndex((a) => a.id === id)
  if (idx === -1) return null
  rows[idx] = { ...rows[idx], ...patch, id }
  await saveTable(TABLE, rows)
  return rows[idx]
}

export async function deleteApplication(id: string): Promise<boolean> {
  const rows = await loadTable<JobApplication>(TABLE)
  const next = rows.filter((a) => a.id !== id)
  if (next.length === rows.length) return false
  await saveTable(TABLE, next)
  return true
}
