import Link from 'next/link'
import { Bot, Target, Clock, Upload } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import SectionCard from '@/components/ui/SectionCard'
import StatusPill from '@/components/ui/StatusPill'
import ReadinessBar from '@/components/ui/ReadinessBar'
import { getApplications } from '@/lib/applications/store'
import { computeReadiness } from '@/lib/readiness'
import { buildTaskSuggestions } from '@/lib/teal/suggestions'
import { getProfile, hasProfile } from '@/lib/profile/store'

export const dynamic = 'force-dynamic'

const gapStyle: Record<string, { bg: string; color: string; border: string }> = {
  Strong:  { bg: '#0a1a0e', color: '#5a9a6a', border: '#1a3520' },
  Weak:    { bg: '#1e1a0a', color: '#C9A96E', border: '#3d3010' },
  Missing: { bg: '#200a0a', color: '#b05050', border: '#401010' },
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6, padding: '8px 0' }}>{children}</div>
}

export default async function DashboardHome() {
  const [applications, readiness, profile] = await Promise.all([
    getApplications(), computeReadiness(), getProfile(),
  ])
  const ready = hasProfile(profile)
  const tasks = ready ? buildTaskSuggestions(readiness, 3) : []

  const applied = applications.filter(a => a.status !== 'SAVED').length
  const interviews = applications.filter(a => a.status === 'INTERVIEW').length
  const gaps = readiness.gaps.filter(g => g.level !== 'Strong').length
  const recentApps = applications.filter(a => a.status !== 'SAVED').slice(0, 3)

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 className="font-head" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Welcome back</h1>
        <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>Here is where you stand today</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <StatCard label="Readiness"  value={ready ? `${readiness.score}%` : '—'} sub={ready ? 'for target role' : 'upload CV'} accent />
        <StatCard label="Applied"    value={applied}    sub="this month" />
        <StatCard label="Interviews" value={interviews} sub="upcoming" />
        <StatCard label="Skill gaps" value={ready ? gaps : '—'} sub="flagged by Teal" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Readiness card */}
        <SectionCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '13px' }}>
            <Target size={14} style={{ color: 'var(--amber)' }} />
            <span className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              CV Readiness{ready && readiness.targetRole ? ` — ${readiness.targetRole}` : ''}
            </span>
          </div>
          {!ready ? (
            <EmptyHint>
              <Upload size={20} style={{ color: 'var(--text3)', display: 'block', marginBottom: '8px' }} />
              Upload your master CV and we will read your skills, score your readiness against live listings, and flag your gaps.
              <div style={{ marginTop: '10px' }}>
                <Link href="/dashboard/resumes" style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--amber)', background: 'var(--amber)', color: '#050505', fontWeight: 500, textDecoration: 'none' }}>Upload CV</Link>
              </div>
            </EmptyHint>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span className="font-head" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--amber)' }}>{readiness.score}%</span>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{gaps} gap{gaps !== 1 ? 's' : ''} to close</span>
              </div>
              <ReadinessBar score={readiness.score} height={8} />
              <div style={{ marginTop: '14px' }}>
                {readiness.gaps.map((gap) => (
                  <div key={gap.skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border2)', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text2)' }}>{gap.skill}</span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', ...gapStyle[gap.level] }}>
                      {gap.level}{gap.appearsIn && gap.level !== 'Strong' ? ` · ${gap.appearsIn}% of listings` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        {/* Teal tasks */}
        <SectionCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '13px' }}>
            <Bot size={14} style={{ color: 'var(--amber)' }} />
            <span className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Teal — What to do next</span>
            {ready && <span style={{ fontSize: '10px', background: '#1e1a0a', border: '1px solid #3d3010', color: 'var(--amber)', padding: '2px 7px', borderRadius: '20px' }}>{tasks.length} tasks</span>}
          </div>
          {!ready ? (
            <EmptyHint>Once your CV is in, Teal compares your skills to live demand and suggests what to build next.</EmptyHint>
          ) : tasks.length === 0 ? (
            <EmptyHint>No gaps to close right now — you are well matched to current listings.</EmptyHint>
          ) : tasks.map((d, i) => (
            <div key={`${d.title}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e1a0a', border: '1px solid #3d3010', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={13} style={{ color: 'var(--amber)' }} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.4, fontWeight: 500 }}>{d.title}</div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text3)', padding: '1px 6px', borderRadius: '4px' }}>{d.skill}</span>
                  {d.freelanceAvailable && <span style={{ fontSize: '10px', background: '#0a1a0e', border: '1px solid #1a3520', color: '#5a9a6a', padding: '1px 6px', borderRadius: '4px' }}>{d.freelancePlatform} · {d.freelanceRate}</span>}
                </div>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Recent applications */}
      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '13px' }}>
          <Clock size={14} style={{ color: 'var(--amber)' }} />
          <span className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Recent applications</span>
        </div>
        {recentApps.length === 0 ? (
          <EmptyHint>No applications yet — Track a discovered job or add one from the <Link href="/dashboard/jobs" style={{ color: 'var(--amber)', textDecoration: 'none' }}>Job Tracker</Link>.</EmptyHint>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {['Job', 'Status', 'CV used', 'Applied'].map(h => (
                <th key={h} style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 500, padding: '0 10px 10px', textAlign: 'left', borderBottom: '1px solid var(--border2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentApps.map((app) => (
              <tr key={app.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '13px' }}>{app.role}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{app.company}</div>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)' }}><StatusPill status={app.status} /></td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)' }}>{app.company} CV</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)' }}>{app.appliedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </SectionCard>
    </div>
  )
}
