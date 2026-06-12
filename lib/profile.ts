import type { ReadinessLevel } from '@/types'
import type { WorkplaceType } from '@/types/jobs'
import { getProfile } from '@/lib/profile/store'

/**
 * The user's aptitude profile — the input to job matching and readiness.
 *
 * Backed by the persisted profile store (lib/profile/store.ts): skills come
 * from the uploaded master CV, the target role + preferences are explicit
 * settings. When nothing has been set up yet this returns an empty profile, and
 * callers render the appropriate "get started" empty state.
 */
export interface UserProfile {
  userId: string
  name: string
  targetRole: string
  /** Canonical skill name -> the user's current level. Absent == not held. */
  skills: Record<string, ReadinessLevel>
  preferences: {
    locations: string[]
    remoteOnly: boolean
    country: string
    workplaceTypes: WorkplaceType[]
  }
}

export async function getUserProfile(userId = 'me'): Promise<UserProfile> {
  const stored = await getProfile()
  return {
    userId,
    name: stored.name,
    targetRole: stored.targetRole,
    skills: stored.skills,
    preferences: stored.preferences,
  }
}
