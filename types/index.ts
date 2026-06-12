export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED'

export type ReadinessLevel = 'Strong' | 'Weak' | 'Missing'

export interface JobApplication {
  id: string
  company: string
  role: string
  status: ApplicationStatus
  location?: string
  notes?: string
  cvVersionId?: string
  appliedAt: string
  matchScore?: number
  readyToApply: boolean
  gapsToClose?: number
}

export interface CVVersion {
  id: string
  label: string
  content: string
  isMaster: boolean
  tags: string[]
  createdAt: string
  linkedJobId?: string
  readiness?: number
  /** Original uploaded filename (master CV only). */
  fileName?: string
  /** Stored path of the uploaded file, relative to .data (master CV only). */
  filePath?: string
  /** Tailored, section-by-section CV content (job-specific versions). */
  sections?: CVSection[]
  /** The job this version was tailored for. */
  jobTitle?: string
  jobUrl?: string
  /** How the tailoring was produced. */
  tailoredBy?: 'claude' | 'heuristic'
}

export interface CVSection {
  /** e.g. "About Me", "Skills", "Projects", "Experience". */
  heading: string
  content: string
  /** What changed vs the master, and why — shown as a hint under the section. */
  note?: string
}

export interface Project {
  id: string
  githubId: number
  name: string
  description?: string
  url: string
  languages: string[]
  visible: boolean
  updatedAt: string
}

export interface SkillGap {
  skill: string
  level: ReadinessLevel
  appearsIn?: number
}

export interface TealNotification {
  id: string
  type: 'job_match' | 'task_suggestion'
  read: boolean
  createdAt: string
  data: TealJobMatch | TealTaskSuggestion
}

export interface TealJobMatch {
  company: string
  role: string
  location: string
  matchScore: number
  reason: string
  url?: string
}

export interface TealTaskSuggestion {
  title: string
  description: string
  skill: string
  priority: 'high' | 'medium' | 'low'
  timeEstimate: string
  freelanceAvailable?: boolean
  freelancePlatform?: string
  freelanceRate?: string
}

export interface ReadinessData {
  score: number
  targetRole: string
  gaps: SkillGap[]
}

// --- Teal AI coaching (lib/teal/coach.ts) ---

export interface TealSkillToAcquire {
  skill: string
  /** Why it matters for the target role + the scraped jobs. */
  rationale: string
  /** How many of the considered scraped jobs require it. */
  appearsInJobs: number
  priority: 'high' | 'medium' | 'low'
}

export interface TealResumeSuggestion {
  /** Which part of the CV to change, e.g. "Skills", "Projects", "Summary". */
  section: string
  /** Concrete change to make. */
  change: string
}

export interface TealPractice {
  platform: string
  /** What to drill, e.g. "Arrays & Hashing, Trees, Java Collections". */
  focus: string
  /** Clickable CTA (constructed in code, never model-generated). */
  url: string
}

export interface TealFreelanceItem {
  title: string
  skill: string
  platform: string
  /** Search URL on the platform (constructed in code). */
  url: string
  rate?: string
}

export interface TealCoaching {
  generatedAt: string
  /** 'claude' when produced by the API, 'fallback' when key absent/errored. */
  source: 'claude' | 'fallback'
  targetRole: string
  /** Number of scraped jobs the advice was based on. */
  jobsConsidered: number
  summary: string
  skillsToAcquire: TealSkillToAcquire[]
  resumeSuggestions: TealResumeSuggestion[]
  practice: TealPractice[]
  freelance: TealFreelanceItem[]
}
