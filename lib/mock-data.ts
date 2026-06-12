import type {
  JobApplication,
  CVVersion,
  Project,
  TealNotification,
  ReadinessData,
} from '@/types'

export const mockReadiness: ReadinessData = {
  score: 62,
  targetRole: 'Frontend Developer',
  gaps: [
    { skill: 'TypeScript',          level: 'Strong',  appearsIn: 90 },
    { skill: 'React',               level: 'Strong',  appearsIn: 95 },
    { skill: 'Testing (Vitest/Jest)',level: 'Missing', appearsIn: 71 },
    { skill: 'Docker',              level: 'Missing', appearsIn: 67 },
    { skill: 'REST API design',     level: 'Weak',    appearsIn: 58 },
  ],
}

export const mockApplications: JobApplication[] = [
  { id: '1', company: 'Vercel',    role: 'Frontend Developer',    status: 'INTERVIEW', location: 'Remote',  appliedAt: '2026-05-30', matchScore: 94, readyToApply: true },
  { id: '2', company: 'Shopify',   role: 'React Engineer',        status: 'APPLIED',   location: 'Remote',  appliedAt: '2026-05-30', matchScore: 88, readyToApply: true },
  { id: '3', company: 'Stripe',    role: 'Junior TS Developer',   status: 'SAVED',     location: 'Warsaw',  appliedAt: '2026-06-01', matchScore: 82, readyToApply: false, gapsToClose: 2 },
  { id: '4', company: 'Linear',    role: 'Software Engineer',     status: 'SAVED',     location: 'Remote',  appliedAt: '2026-05-28', matchScore: 79, readyToApply: false, gapsToClose: 2 },
  { id: '5', company: 'Notion',    role: 'Product Engineer',      status: 'INTERVIEW', location: 'Remote',  appliedAt: '2026-05-20', matchScore: 77, readyToApply: true },
  { id: '6', company: 'Basecamp',  role: 'Junior Developer',      status: 'OFFER',     location: 'Remote',  appliedAt: '2026-05-15', matchScore: 75, readyToApply: true },
  { id: '7', company: 'N26',       role: 'Junior Frontend',       status: 'REJECTED',  location: 'Berlin',  appliedAt: '2026-05-22', matchScore: 70, readyToApply: false, gapsToClose: 3 },
]

export const mockCVVersions: CVVersion[] = [
  { id: '1', label: 'John Smith',         content: '', isMaster: true,  tags: ['Next.js', 'TypeScript', 'React', 'PostgreSQL'], createdAt: '2026-06-03', readiness: 62 },
  { id: '2', label: 'Vercel Application', content: '', isMaster: false, tags: ['Next.js', 'Vercel', 'Performance'],             createdAt: '2026-06-02', linkedJobId: '1' },
  { id: '3', label: 'Shopify Application',content: '', isMaster: false, tags: ['React', 'Commerce', 'APIs'],                   createdAt: '2026-05-30', linkedJobId: '2' },
]

export const mockProjects: Project[] = [
  { id: '1', githubId: 1001, name: 'CareerHQ',          description: 'Personal job tracking and portfolio management platform with AI assistant.', url: 'https://github.com/johnsmith/careerhq',          languages: ['TypeScript', 'Next.js', 'PostgreSQL'], visible: true,  updatedAt: '2026-06-05' },
  { id: '2', githubId: 1002, name: 'weather-app',        description: 'Weather dashboard built with React and the OpenWeather API.',               url: 'https://github.com/johnsmith/weather-app',        languages: ['React', 'JavaScript', 'CSS'],           visible: true,  updatedAt: '2026-06-02' },
  { id: '3', githubId: 1003, name: 'uni-notes-api',      description: 'REST API for managing university notes, built with Express and MongoDB.',   url: 'https://github.com/johnsmith/uni-notes-api',      languages: ['Node.js', 'Express', 'MongoDB'],        visible: false, updatedAt: '2026-05-20' },
  { id: '4', githubId: 1004, name: 'sorting-visualiser', description: 'Visual comparison of sorting algorithms with animation controls.',          url: 'https://github.com/johnsmith/sorting-visualiser', languages: ['JavaScript', 'HTML', 'CSS'],            visible: true,  updatedAt: '2026-05-01' },
]

export const mockTealNotifications: TealNotification[] = [
  {
    id: '1', type: 'job_match', read: false, createdAt: '2026-06-05T10:00:00Z',
    data: { company: 'Vercel', role: 'Frontend Developer', location: 'Remote · Full-time', matchScore: 94, reason: 'Strong Next.js and TypeScript fit. You are already in interview — this is your best current shot.' },
  },
  {
    id: '2', type: 'job_match', read: false, createdAt: '2026-06-05T10:00:00Z',
    data: { company: 'Shopify', role: 'React Engineer', location: 'Remote · Full-time', matchScore: 88, reason: 'Applied. Close the testing gap before your interview to significantly strengthen your position.' },
  },
  {
    id: '3', type: 'job_match', read: true, createdAt: '2026-06-05T10:00:00Z',
    data: { company: 'Stripe', role: 'Junior TypeScript Developer', location: 'Warsaw · Hybrid', matchScore: 82, reason: 'Good fit. Close Docker and testing gaps before applying — currently 2 gaps away from being competitive.' },
  },
  {
    id: '4', type: 'task_suggestion', read: false, createdAt: '2026-06-05T10:00:00Z',
    data: { title: 'Containerise a Next.js app with Docker', description: 'Closes the Docker gap. Push it to GitHub and it immediately improves your portfolio signal for 67% of your target listings.', skill: 'Docker · missing', priority: 'high', timeEstimate: '~1 day', freelanceAvailable: true, freelancePlatform: 'Upwork', freelanceRate: '$80–120' },
  },
  {
    id: '5', type: 'task_suggestion', read: false, createdAt: '2026-06-05T10:00:00Z',
    data: { title: 'Write tests for an existing project', description: 'Pick any project on your GitHub and add Vitest unit tests. No new project needed — just evidence you can test code.', skill: 'Testing · missing', priority: 'high', timeEstimate: '~half a day', freelanceAvailable: false },
  },
  {
    id: '6', type: 'task_suggestion', read: false, createdAt: '2026-06-05T10:00:00Z',
    data: { title: 'Build a REST API with authentication', description: 'A small Node.js + Express API with JWT auth closes the REST API gap and can double as a portfolio piece and a real client project.', skill: 'REST APIs · weak', priority: 'medium', timeEstimate: '~2 days', freelanceAvailable: true, freelancePlatform: 'Fiverr', freelanceRate: '$60–100' },
  },
]
