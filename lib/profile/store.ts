import type { ReadinessLevel } from '@/types'
import type { WorkplaceType } from '@/types/jobs'
import { findSkillsInText } from '@/lib/jobs/skills'
import { loadTable, saveTable } from '@/lib/store/json-table'

/**
 * The user's aptitude profile, persisted in .data/profile.json. This replaces
 * the old mock-derived profile: skills now come from the master CV the user
 * uploads (see applyCvSkills), and the target role is an explicit setting.
 *
 * An empty profile is a valid, expected state — a brand-new user who hasn't
 * uploaded a CV yet. The UI shows "upload your CV" rather than fabricating data.
 */
export interface StoredProfile {
  /** Display name (sidebar/greeting). Empty until set. */
  name: string
  targetRole: string
  /** Canonical skill name -> level. Skills found on the CV are recorded Strong. */
  skills: Record<string, ReadinessLevel>
  preferences: {
    locations: string[]
    remoteOnly: boolean
    /** Country to restrict scraping to. Defaults to Poland. */
    country: string
    /** Which workplace types to scrape. Defaults to all three. */
    workplaceTypes: WorkplaceType[]
  }
  /** ISO date the CV-derived skills were last refreshed; undefined = no CV yet. */
  cvProcessedAt?: string
}

const TABLE = 'profile'

const EMPTY: StoredProfile = {
  name: '',
  targetRole: '',
  skills: {},
  preferences: {
    locations: [],
    remoteOnly: false,
    country: 'Poland',
    workplaceTypes: ['remote', 'hybrid', 'office'],
  },
}

// Stored as a single-row table to reuse the JSON-table helper.
export async function getProfile(): Promise<StoredProfile> {
  const rows = await loadTable<StoredProfile>(TABLE)
  const stored = rows[0]
  if (!stored) return { ...EMPTY }
  // Merge so profiles saved before these fields existed still get defaults.
  return {
    ...EMPTY,
    ...stored,
    preferences: { ...EMPTY.preferences, ...stored.preferences },
  }
}

async function save(profile: StoredProfile): Promise<void> {
  await saveTable(TABLE, [profile])
}

/** True once a CV has been processed and at least one skill is on file. */
export function hasProfile(profile: StoredProfile): boolean {
  return Boolean(profile.cvProcessedAt) && Object.keys(profile.skills).length > 0
}

/** Replace CV-derived skills from freshly extracted CV text. */
export async function applyCvSkills(text: string): Promise<StoredProfile> {
  const profile = await getProfile()
  const found = findSkillsInText(text, [])
  const skills: Record<string, ReadinessLevel> = {}
  for (const skill of found) skills[skill] = 'Strong'
  const next: StoredProfile = { ...profile, skills, cvProcessedAt: new Date().toISOString() }
  await save(next)
  return next
}

export async function setTargetRole(role: string): Promise<StoredProfile> {
  const profile = await getProfile()
  const next = { ...profile, targetRole: role.trim() }
  await save(next)
  return next
}

export async function setName(name: string): Promise<StoredProfile> {
  const profile = await getProfile()
  const next = { ...profile, name: name.trim() }
  await save(next)
  return next
}

export async function setPreferences(
  prefs: Partial<StoredProfile['preferences']>,
): Promise<StoredProfile> {
  const profile = await getProfile()
  const next = { ...profile, preferences: { ...profile.preferences, ...prefs } }
  await save(next)
  return next
}
