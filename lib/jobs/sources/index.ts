import type { JobSource } from './types'
import { arbeitnowSource } from './arbeitnow'
import { justjoinSource } from './justjoin'
import { linkedinSource } from './linkedin'

export type { JobSource, JobQuery } from './types'

/** All known sources, in priority order. Add new adapters here. */
export const ALL_SOURCES: JobSource[] = [arbeitnowSource, justjoinSource, linkedinSource]

/** Sources usable in the current environment (credentials present, etc.). */
export function getEnabledSources(): JobSource[] {
  return ALL_SOURCES.filter((s) => s.isEnabled())
}
