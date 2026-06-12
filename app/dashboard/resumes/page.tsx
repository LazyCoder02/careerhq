'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Plus, Upload, FileText, Trash2, X, Sparkles, ExternalLink } from 'lucide-react'
import type { CVVersion } from '@/types'

interface JobLite { id: string; title: string; company: string }

const btnPrimary: React.CSSProperties = { fontSize: '11px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--amber)', background: 'var(--amber)', color: '#050505', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit' }
const btnGhost: React.CSSProperties = { fontSize: '11px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border2)', background: 'var(--card2)', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit' }
const inputStyle: React.CSSProperties = { fontSize: '12px', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card2)', color: 'var(--text)', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const chip: React.CSSProperties = { fontSize: '10px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text3)', padding: '2px 6px', borderRadius: '4px' }

export default function ResumesPage() {
  const [resumes, setResumes] = useState<CVVersion[]>([])
  const [jobs, setJobs] = useState<JobLite[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [creating, setCreating] = useState(false)
  // create-version form
  const [vLabel, setVLabel] = useState('')
  const [mode, setMode] = useState<'job' | 'paste'>('job')
  const [jobId, setJobId] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const master = resumes.find(r => r.isMaster) ?? null
  const versions = resumes.filter(r => !r.isMaster)

  async function load() {
    const [r, j] = await Promise.all([
      fetch('/api/resumes').then(r => r.json()).catch(() => ({ resumes: [] })),
      fetch('/api/jobs?limit=20').then(r => r.json()).catch(() => ({ matches: [] })),
    ])
    setResumes(r.resumes ?? [])
    setJobs((j.matches ?? []).map((m: { job: JobLite }) => ({ id: m.job.id, title: m.job.title, company: m.job.company })))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function upload(file: File) {
    setBusy(true); setMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (role.trim()) fd.append('targetRole', role.trim())
      if (name.trim()) fd.append('name', name.trim())
      const res = await fetch('/api/resumes/upload', { method: 'POST', body: fd })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setMsg(d.error ?? `Upload failed (${res.status})`); return }
      setMsg(d.textExtracted ? `Uploaded · ${d.skillsFound} skills detected for your profile` : 'Uploaded, but no text could be read from this file')
      await load()
    } catch { setMsg('Upload failed — please try again') }
    finally { setBusy(false) }
  }

  async function createVersion() {
    if (!vLabel.trim()) return
    if (mode === 'job' && !jobId) { setMsg('Pick a scraped job, or switch to pasting a description.'); return }
    if (mode === 'paste' && !jobDesc.trim()) { setMsg('Paste the job description.'); return }
    setBusy(true); setMsg(null)
    try {
      const payload = mode === 'job'
        ? { label: vLabel.trim(), jobId }
        : { label: vLabel.trim(), jobDescription: jobDesc.trim(), jobUrl: jobUrl.trim() || undefined }
      const res = await fetch('/api/resumes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setMsg(d.error ?? 'Could not create version'); return }
      setVLabel(''); setJobId(''); setJobDesc(''); setJobUrl(''); setCreating(false)
      await load()
    } finally { setBusy(false) }
  }

  async function remove(id: string) {
    await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 className="font-head" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Your Resumes</h1>
        <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>One master CV. AI-tailored versions for each job.</p>
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />

      {loading ? (
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Loading…</div>
      ) : !master ? (
        <div style={{ background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: '10px', padding: '40px 20px', textAlign: 'center' }}>
          <Upload size={26} style={{ color: 'var(--text3)', marginBottom: '10px' }} />
          <div className="font-head" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Upload your master CV</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px', lineHeight: 1.5 }}>
            PDF, DOCX, or TXT. We read it to detect your skills and power readiness, matches, and tailored versions.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
            <input style={inputStyle} placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} />
            <input style={inputStyle} placeholder="Target role (optional, e.g. Backend Java Internship)" value={role} onChange={e => setRole(e.target.value)} />
            <button style={{ ...btnPrimary, justifyContent: 'center' }} disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload size={12} /> {busy ? 'Uploading…' : 'Choose file'}
            </button>
          </div>
          {msg && <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '12px' }}>{msg}</div>}
        </div>
      ) : (
        <>
          {msg && <div style={{ fontSize: '11px', color: 'var(--amber)', marginBottom: '12px' }}>{msg}</div>}

          {/* Master */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--amber)', borderRadius: '10px', padding: '14px', marginBottom: '12px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '11px', right: '11px', fontSize: '9px', background: '#1e1a0a', border: '1px solid var(--amber)', color: 'var(--amber)', padding: '2px 6px', borderRadius: '6px' }}>Master CV</span>
            <div className="font-head" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={13} style={{ color: 'var(--amber)' }} /> {master.fileName ?? master.label}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>Uploaded {master.createdAt}</div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <a href={`/api/resumes/${master.id}/file`} style={{ ...btnGhost, textDecoration: 'none' }}><Download size={11} /> Download</a>
              <button style={btnGhost} onClick={() => fileRef.current?.click()} disabled={busy}><Upload size={11} /> Replace</button>
            </div>
          </div>

          {/* Tailored versions */}
          {versions.map(cv => (
            <div key={cv.id} style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <div className="font-head" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{cv.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {cv.jobTitle && <span>For: {cv.jobTitle}</span>}
                    {cv.jobUrl && <a href={cv.jobUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text3)', display: 'inline-flex', alignItems: 'center' }}><ExternalLink size={11} /></a>}
                    <span style={{ ...chip, ...(cv.tailoredBy === 'claude' ? { color: 'var(--amber)', background: '#1e1a0a', borderColor: '#3d3010' } : {}) }}>
                      {cv.tailoredBy === 'claude' ? 'AI-tailored' : 'heuristic'}
                    </span>
                    <span>· {cv.createdAt}</span>
                  </div>
                </div>
                <button style={btnGhost} onClick={() => remove(cv.id)}><Trash2 size={11} /> Delete</button>
              </div>
              {cv.sections?.map((s, i) => (
                <div key={i} style={{ padding: '9px 0', borderTop: '1px solid var(--border2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{s.heading}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{s.content}</div>
                  {s.note && <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '4px', fontStyle: 'italic' }}>↳ {s.note}</div>}
                </div>
              ))}
            </div>
          ))}

          {/* Create version */}
          {creating ? (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                <Sparkles size={14} style={{ color: 'var(--amber)' }} />
                <span className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Tailor a new version</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <input style={inputStyle} placeholder="Version name (e.g. Allegro — Backend Intern)" value={vLabel} onChange={e => setVLabel(e.target.value)} autoFocus />
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['job', 'paste'] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)} style={{ ...btnGhost, flex: 1, justifyContent: 'center', ...(mode === m ? { borderColor: 'var(--amber)', color: 'var(--amber)' } : {}) }}>
                      {m === 'job' ? 'From a scraped job' : 'Paste a description'}
                    </button>
                  ))}
                </div>
                {mode === 'job' ? (
                  jobs.length ? (
                    <select style={inputStyle} value={jobId} onChange={e => setJobId(e.target.value)}>
                      <option value="">Select a scraped job…</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.company}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>No scraped jobs yet — paste a description instead.</div>
                  )
                ) : (
                  <>
                    <textarea style={{ ...inputStyle, minHeight: '110px', resize: 'vertical' }} placeholder="Paste the job description here…" value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
                    <input style={inputStyle} placeholder="Job link (optional)" value={jobUrl} onChange={e => setJobUrl(e.target.value)} />
                  </>
                )}
                <div style={{ display: 'flex', gap: '7px' }}>
                  <button style={btnPrimary} onClick={createVersion} disabled={busy || !vLabel.trim()}>
                    <Sparkles size={11} /> {busy ? 'Tailoring…' : 'Tailor version'}
                  </button>
                  <button style={btnGhost} onClick={() => { setCreating(false); setMsg(null) }}><X size={11} /> Cancel</button>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Teal rewrites your master CV — About Me, Skills, Projects, Experience — for this job. It only re-emphasises what is already in your CV.</div>
              </div>
            </div>
          ) : (
            <div onClick={() => setCreating(true)} style={{ border: '1px dashed var(--border)', borderRadius: '10px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text3)' }}>
              <Plus size={18} /> <span style={{ fontSize: '12px' }}>Tailor a new version for a job</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
