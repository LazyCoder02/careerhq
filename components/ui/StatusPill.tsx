import type { ApplicationStatus } from '@/types'

const styles: Record<ApplicationStatus, { bg: string; color: string; border: string }> = {
  SAVED:     { bg: '#0e1520', color: '#5a8ab0', border: '#1a2a40' },
  APPLIED:   { bg: '#0d1a30', color: '#6b9bdf', border: '#1a3060' },
  INTERVIEW: { bg: '#141f0a', color: '#7ac142', border: '#253510' },
  OFFER:     { bg: '#1e1a0a', color: '#C9A96E', border: '#3d3010' },
  REJECTED:  { bg: '#200a0a', color: '#b05050', border: '#401010' },
}

export default function StatusPill({ status }: { status: ApplicationStatus }) {
  const s = styles[status]
  return (
    <span style={{
      fontSize: '10px',
      padding: '2px 7px',
      borderRadius: '10px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}
