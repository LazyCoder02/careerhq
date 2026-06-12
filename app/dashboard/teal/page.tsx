import { Bot, Target, Briefcase } from 'lucide-react'
import { computeReadiness } from '@/lib/readiness'
import { getScoredMatches } from '@/lib/jobs/matches'
import { getProfile, hasProfile } from '@/lib/profile/store'
import TealCoach from '@/components/teal/TealCoach'

export const dynamic = 'force-dynamic'

const gapStyle: Record<string, { bg: string; color: string; border: string }> = {
  Strong:  { bg: '#0a1a0e', color: '#5a9a6a', border: '#1a3520' },
  Weak:    { bg: '#1e1a0a', color: '#C9A96E', border: '#3d3010' },
  Missing: { bg: '#200a0a', color: '#b05050', border: '#401010' },
}

export default async function TealPage() {
  const [readiness, profile] = await Promise.all([computeReadiness(), getProfile()])
  const ready = hasProfile(profile)
  const activeGaps = ready ? readiness.gaps.filter(g => g.level !== 'Strong') : []

  // Top scored postings from the ingestion pipeline (READY/STRETCH first).
  const matches = await getScoredMatches()
  const jobMatches = matches.filter(m => m.category !== 'REACH').slice(0, 4)

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 className="font-head" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Teal</h1>
        <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>Your personal AI career coach</p>
      </div>

      <div style={{ maxWidth: '600px' }}>

        {/* Teal status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'var(--card)', border: '1px solid #2a2010', borderRadius: '10px', marginBottom: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e1a0a', border: '2px solid var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div>
            <div className="font-head" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Teal</div>
            <div style={{ fontSize: '10px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)', display: 'inline-block', animation: 'blink 2s infinite' }} />
              Active · runs every 6 hours
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Tracking</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '1px' }}>{matches.length} live postings</div>
          </div>
        </div>

        {/* Readiness gap */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <Target size={14} style={{ color: 'var(--amber)' }} />
            <span className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Your readiness gap</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px', lineHeight: 1.6 }}>
            {ready ? (
              <>You are targeting{' '}
              <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{readiness.targetRole || 'your target'}</span>{' '}
              roles. Here is what is holding you back from most listings right now.</>
            ) : (
              <>Upload your master CV (Resumes tab) and Teal will read your skills, then show exactly what is holding you back from your target listings.</>
            )}
          </div>
          {activeGaps.length === 0 && ready && (
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No active gaps — your skills cover the current demand well.</div>
          )}
          {activeGaps.map((gap) => (
            <div key={gap.skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border2)', fontSize: '12px' }}>
              <span style={{ color: 'var(--text2)' }}>{gap.skill}</span>
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', ...gapStyle[gap.level] }}>
                {gap.level}{gap.appearsIn ? ` · appears in ${gap.appearsIn}% of listings` : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Teal AI coaching: skills across the scraped jobs, resume tuning,
            interview practice, and freelance work. Renders its own states. */}
        <TealCoach />

        {/* Job matches */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '13px' }}>
            <Briefcase size={14} style={{ color: 'var(--amber)' }} />
            <span className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Jobs worth watching</span>
            <span style={{ fontSize: '10px', background: '#1e1a0a', border: '1px solid #3d3010', color: 'var(--amber)', padding: '2px 7px', borderRadius: '20px' }}>
              from {matches.length} postings
            </span>
          </div>
          {jobMatches.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '8px 0' }}>
              No strong matches yet. Run ingestion (or wait for the 6-hourly cron) to pull fresh postings.
            </div>
          ) : jobMatches.map((m, i) => (
            <div key={m.job.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: i < jobMatches.length - 1 ? '1px solid var(--border2)' : 'none' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '7px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--amber)', flexShrink: 0 }}>
                {m.job.company.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{m.job.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{m.job.company}{m.job.location ? ` · ${m.job.location}` : ''}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', lineHeight: 1.4 }}>{m.reason}</div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)', background: '#1e1a0a', border: '1px solid #3d3010', padding: '3px 7px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                {m.matchScore}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
