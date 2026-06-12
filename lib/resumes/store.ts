import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { CVVersion } from '@/types'
import { loadTable, saveTable, newId } from '@/lib/store/json-table'

/**
 * Stored CV versions: one uploaded master CV plus job-specific versions derived
 * from it. Starts empty until the user uploads a master CV. The uploaded file
 * itself is written under .data/uploads; the row keeps its path + extracted text.
 */

const TABLE = 'resumes'
const UPLOAD_DIR = path.join(process.cwd(), '.data', 'uploads')

export async function getResumes(): Promise<CVVersion[]> {
  const rows = await loadTable<CVVersion>(TABLE)
  // Master first, then newest.
  return [...rows].sort(
    (a, b) => Number(b.isMaster) - Number(a.isMaster) || b.createdAt.localeCompare(a.createdAt),
  )
}

export async function getMaster(): Promise<CVVersion | null> {
  const rows = await loadTable<CVVersion>(TABLE)
  return rows.find((r) => r.isMaster) ?? null
}

export async function getResume(id: string): Promise<CVVersion | null> {
  const rows = await loadTable<CVVersion>(TABLE)
  return rows.find((r) => r.id === id) ?? null
}

export interface SaveMasterInput {
  fileName: string
  fileBuffer: Buffer
  content: string
}

/** Save (or replace) the uploaded master CV and its extracted text. */
export async function saveMaster(input: SaveMasterInput): Promise<CVVersion> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const id = newId()
  const ext = input.fileName.includes('.') ? `.${input.fileName.split('.').pop()}` : ''
  const relPath = path.join('uploads', `${id}${ext}`)
  await fs.writeFile(path.join(process.cwd(), '.data', relPath), input.fileBuffer)

  const rows = await loadTable<CVVersion>(TABLE)
  // Only one master: drop any previous master row.
  const withoutMaster = rows.filter((r) => !r.isMaster)
  const master: CVVersion = {
    id,
    label: 'Master CV',
    content: input.content,
    isMaster: true,
    tags: ['master'],
    createdAt: new Date().toISOString().slice(0, 10),
    fileName: input.fileName,
    filePath: relPath,
  }
  await saveTable(TABLE, [master, ...withoutMaster])
  return master
}

export interface NewVersionInput {
  label: string
  linkedJobId?: string
  jobTitle?: string
  jobUrl?: string
  tags?: string[]
  sections?: import('@/types').CVSection[]
  tailoredBy?: 'claude' | 'heuristic'
}

/** Create a job-specific version. If tailored sections are supplied, store them
 *  (and a flat text rendering as `content`); otherwise copy the master content. */
export async function createVersion(input: NewVersionInput): Promise<CVVersion> {
  const rows = await loadTable<CVVersion>(TABLE)
  const master = rows.find((r) => r.isMaster)
  const content = input.sections?.length
    ? input.sections.map((s) => `## ${s.heading}\n${s.content}`).join('\n\n')
    : master?.content ?? ''
  const cv: CVVersion = {
    id: newId(),
    label: input.label,
    content,
    isMaster: false,
    tags: input.tags ?? (input.tailoredBy === 'claude' ? ['tailored', 'ai'] : ['tailored']),
    createdAt: new Date().toISOString().slice(0, 10),
    linkedJobId: input.linkedJobId,
    jobTitle: input.jobTitle,
    jobUrl: input.jobUrl,
    sections: input.sections,
    tailoredBy: input.tailoredBy,
  }
  rows.push(cv)
  await saveTable(TABLE, rows)
  return cv
}

export async function deleteResume(id: string): Promise<boolean> {
  const rows = await loadTable<CVVersion>(TABLE)
  const target = rows.find((r) => r.id === id)
  if (!target) return false
  if (target.filePath) {
    await fs.rm(path.join(process.cwd(), '.data', target.filePath)).catch(() => {})
  }
  await saveTable(TABLE, rows.filter((r) => r.id !== id))
  return true
}

/** Absolute path of a stored CV file, for download routes. */
export function absoluteFilePath(relPath: string): string {
  return path.join(process.cwd(), '.data', relPath)
}
