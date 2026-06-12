'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Sparkles, ExternalLink, RefreshCw } from 'lucide-react'
import type { JobApplication, ApplicationStatus } from '@/types'
import type { JobMatch } from '@/types/jobs'

const pipelineSteps = [
  { label: 'Saved',     status: 'SAVED' as const,     color: '#D7D5D5' },
  { label: 'Applied',   status: 'APPLIED' as const,   color: '#6b9bdf' },
  { label: 'Interview', status: 'INTERVIEW' as const, color: '#7ac142' },
  { label: 'Offer',     status: 'OFFER' as const,     color: '#C9A96E' },
]
const STATUSES: ApplicationStatus[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']

const selectStyle: React.CSSProperties = { fontSize: '11px', padding: '3px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card2)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }
const inputStyle: React.CSSProperties = { fontSize: '12px', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card2)', color: 'var(--text)', fontFamily: 'inherit', flex: 1, minWidth: 0 }
const emptyForm = { company: '', role: '', location: '', status: 'SAVED' as ApplicationStatus }

const catStyle: Record<string, { bg: string; color: string; border: string }> = {
  READY:   { bg: '#0a1a0e', color: '#5a9a6a', border: '#1a3520' },
  STRETCH: { bg: '#1e1a0a', color: '#C9A96E', border: '#3d3010' },
  REACH:   { bg: '#200a0a', color: '#b05050', border: '#401010' },
}

export default function JobTrackerPage() {
  const [apps, setApps] = useState<JobApplication[]>([])
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [workplaces, setWorkplaces] = useState<string[]>(['remote', 'hybrid', 'office'])
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null)

  async function loadApps() {
    const d = await fetch('/api/applications').then(r => r.json()).catch(() => ({ applications: [] }))
    setApps(d.applications ?? [])
  }
  async function loadMatches() {
    const d = await fetch('/api/jobs?limit=10').then(r => r.json()).catch(() => ({ matches: [] }))
    setMatches(d.matches ?? [])
  }
  useEffect(() => {
    Promise.all([
      loadApps(),
      loadMatches(),
      fetch('/api/profile').then(r => r.json()).then(d => {
        const wt = d.profile?.preferences?.workplaceTypes
        if (Array.isArray(wt)) setWorkplaces(wt)
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  async function toggleWorkplace(type: string) {
    const next = workplaces.includes(type) ? workplaces.filter(w => w !== type) : [...workplaces, type]
    setWorkplaces(next)
    // Persist so future scrapes use it too.
    fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences: { workplaceTypes: next } }) }).catch(() => {})
  }

  async function scrapeNow() {
    setScraping(true); setScrapeMsg(null)
    try {
      const res = await fetch('/api/jobs/refresh', { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) { setScrapeMsg(d.error ? `Scrape failed: ${d.error}` : 'Scrape failed'); return }
      await loadMatches()
      const added = (d.inserted ?? 0) + (d.updated ?? 0)
      const errs = (d.sources ?? []).filter((s: { error?: string }) => s.error)
      setScrapeMsg(
          added > 0
              ? `Added/updated ${added} job${added !== 1 ? 's' : ''}.`
              : errs.length
                  ? `No jobs added. ${errs.map((s: { source: string; error?: string }) => `${s.source}: ${s.error}`).join('; ')}`
                  : 'No new Poland jobs matched your filters this run.',
      )
    } catch {
      setScrapeMsg('Scrape failed — please try again')
    } finally { setScraping(false) }
  }

  // Discovered jobs not already tracked, restricted to the selected workplace types.
  const tracked = new Set(apps.map(a => `${a.company}|${a.role}`.toLowerCase()))
  const discovered = matches.filter(m =>
      !tracked.has(`${m.job.company}|${m.job.title}`.toLowerCase()) &&
      (!m.job.workplaceType || workplaces.includes(m.job.workplaceType)),
  )

  async function trackMatch(m: JobMatch) {
    const optimistic: JobApplication = {
      id: `tmp-${m.job.id}`, company: m.job.company, role: m.job.title, status: 'SAVED',
      location: m.job.location, appliedAt: new Date().toISOString().slice(0, 10),
      matchScore: m.matchScore, readyToApply: m.category === 'READY', gapsToClose: m.missingSkills.length,
    }
    setApps(prev => [optimistic, ...prev])
    await fetch('/api/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: m.job.company, role: m.job.title, location: m.job.location, status: 'SAVED', matchScore: m.matchScore, readyToApply: m.category === 'READY', gapsToClose: m.missingSkills.length }),
    }).catch(() => {})
    await loadApps()
  }

  async function addJob() {
    if (!form.company.trim() || !form.role.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const { application } = await res.json()
      if (application) setApps(prev => [application, ...prev])
      setForm(emptyForm); setAdding(false)
    } finally { setSaving(false) }
  }

  async function changeStatus(id: string, status: ApplicationStatus) {
    const prev = apps
    setApps(cur => cur.map(a => (a.id === id ? { ...a, status } : a)))
    try {
      await fetch(`/api/applications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    } catch { setApps(prev) }
  }

  return (
      <div>
        <div style={{ marginBottom: '22px' }}>
          <h1 className="font-head" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Job Tracker</h1>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>Apply less. Apply better.</p>
        </div>

        {/* Pipeline bar */}
        <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          {pipelineSteps.map(({ label, status, color }, i) => (
              <div key={status} style={{ flex: 1, padding: '12px 10px', textAlign: 'center', borderRight: i < pipelineSteps.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                <div className="font-head" style={{ fontSize: '20px', fontWeight: 700, color }}>{apps.filter(a => a.status === status).length}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
              </div>
          ))}
        </div>

        {/* Discovered (scraped) jobs */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '13px', flexWrap: 'wrap' }}>
            <Sparkles size={14} style={{ color: 'var(--amber)' }} />
            <span className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Discovered for you</span>
            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>Poland · scraped from your sources</span>
            <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto', alignItems: 'center' }}>
              {(['remote', 'hybrid', 'office'] as const).map(t => {
                const on = workplaces.includes(t)
                return (
                    <button key={t} onClick={() => toggleWorkplace(t)}
                            style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                              border: `1px solid ${on ? 'var(--amber)' : 'var(--border)'}`,
                              background: on ? '#1e1a0a' : 'var(--card2)',
                              color: on ? 'var(--amber)' : 'var(--text3)' }}>
                      {t}
                    </button>
                )
              })}
              <button onClick={scrapeNow} disabled={scraping}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 11px', borderRadius: '6px', cursor: scraping ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 500, marginLeft: '4px',
                        border: '1px solid var(--amber)', background: scraping ? 'var(--card2)' : 'var(--amber)', color: scraping ? 'var(--text2)' : '#050505' }}>
                <RefreshCw size={11} className={scraping ? 'spin' : ''} /> {scraping ? 'Scraping…' : 'Scrape now'}
              </button>
            </div>
          </div>
          {scrapeMsg && <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>{scrapeMsg}</div>}
          {loading ? (
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Loading…</div>
          ) : discovered.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5 }}>
                No postings yet. Hit <strong style={{ color: 'var(--text2)' }}>Scrape now</strong> to pull Poland jobs immediately, or wait for the daily run. (JustJoin.it scraping needs <code style={{ color: 'var(--text2)' }}>APIFY_TOKEN</code> set.)
              </div>
          ) : discovered.slice(0, 6).map((m, i) => (
              <div key={m.job.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < Math.min(discovered.length, 6) - 1 ? '1px solid var(--border2)' : 'none' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap', ...catStyle[m.category] }}>{m.matchScore}%</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.job.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{m.job.company}{m.job.location ? ` · ${m.job.location}` : ''}</div>
                </div>
                {m.job.url && <a href={m.job.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text3)' }}><ExternalLink size={13} /></a>}
                <button onClick={() => trackMatch(m)} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--amber)', background: 'var(--amber)', color: '#050505', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>Track</button>
              </div>
          ))}
        </div>

        {/* Applications table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Your applications</span>
            <button onClick={() => setAdding(v => !v)} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--amber)', background: adding ? 'var(--card2)' : 'var(--amber)', color: adding ? 'var(--text2)' : '#050505', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
              {adding ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add job</>}
            </button>
          </div>

          {adding && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', padding: '12px', background: 'var(--card2)', border: '1px solid var(--border2)', borderRadius: '8px' }}>
                <input style={inputStyle} placeholder="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                <input style={inputStyle} placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                <input style={inputStyle} placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                <select style={selectStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ApplicationStatus }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={addJob} disabled={saving || !form.company.trim() || !form.role.trim()} style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '6px', border: '1px solid var(--amber)', background: 'var(--amber)', color: '#050505', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit', opacity: saving || !form.company.trim() || !form.role.trim() ? 0.5 : 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
          )}

          {loading ? (
              <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '6px 0' }}>Loading…</div>
          ) : apps.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '6px 0' }}>Nothing tracked yet — Track a discovered job above, or add one manually.</div>
          ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed' }}>
                <thead>
                <tr>
                  {['Job + Company', 'Status', 'Teal score', 'Location', 'Date saved', 'Ready to apply'].map((h, i) => (
                      <th key={h} style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 500, padding: '0 10px 10px', textAlign: 'left', borderBottom: '1px solid var(--border2)', width: i === 0 ? '26%' : i === 5 ? '18%' : '14%' }}>{h}</th>
                  ))}
                </tr>
                </thead>
                <tbody>
                {apps.map((app) => (
                    <tr key={app.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{app.company}</div>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)' }}>
                        <select value={app.status} onChange={e => changeStatus(app.id, e.target.value as ApplicationStatus)} style={selectStyle}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)' }}>
                        {app.matchScore != null && <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)', background: '#1e1a0a', border: '1px solid #3d3010', padding: '2px 7px', borderRadius: '6px' }}>{app.matchScore}%</span>}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)' }}>{app.location}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)' }}>{app.appliedAt}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border2)' }}>
                        {app.readyToApply ? (
                            <span style={{ fontSize: '10px', background: '#0a1a0e', border: '1px solid #1a3520', color: '#5a9a6a', padding: '2px 7px', borderRadius: '6px' }}>Ready</span>
                        ) : (
                            <span style={{ fontSize: '10px', background: '#200a0a', border: '1px solid #401010', color: '#b05050', padding: '2px 7px', borderRadius: '6px' }}>
                      {app.gapsToClose ? `Close ${app.gapsToClose} gap${app.gapsToClose !== 1 ? 's' : ''} first` : 'Not ready'}
                    </span>
                        )}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </div>
      </div>
  )
}
