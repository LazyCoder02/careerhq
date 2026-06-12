'use client'

import { useEffect, useState } from 'react'
import { GitBranch } from 'lucide-react'
import type { Project } from '@/types'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: 'relative', width: '26px', height: '14px', cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: checked ? 'var(--amber)' : 'var(--card2)', border: `1px solid ${checked ? 'var(--amber)' : 'var(--border)'}`, borderRadius: '10px', transition: 'all 0.2s' }} />
      <div style={{ position: 'absolute', top: '2px', left: checked ? '14px' : '2px', width: '8px', height: '8px', borderRadius: '50%', background: checked ? '#050505' : 'var(--text3)', transition: 'left 0.2s' }} />
    </label>
  )
}

function ProjectCard({ project, onToggle }: { project: Project; onToggle: (visible: boolean) => void }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px', transition: 'border-color 0.15s', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div className="font-head" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{project.name}</div>
        <a href={project.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--text3)', textDecoration: 'none' }}
          onClick={e => e.stopPropagation()}>
          <GitBranch size={11} /> github
        </a>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.5, marginBottom: '9px' }}>{project.description}</div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '9px' }}>
        {project.languages.map(lang => (
          <span key={lang} style={{ fontSize: '10px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '2px 6px', borderRadius: '4px' }}>
            {lang}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '9px', borderTop: '1px solid var(--border2)' }}>
        <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Updated {project.updatedAt}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text3)' }}>Portfolio</span>
          <Toggle checked={project.visible} onChange={onToggle} />
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => {
        setConfigured(d.configured !== false)
        setProjects(d.projects ?? [])
        if (d.error) setError(d.error)
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  async function toggleVisibility(id: string, visible: boolean) {
    // Optimistic update, then persist.
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, visible } : p)))
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible }),
      })
    } catch {
      // Roll back on failure.
      setProjects(prev => prev.map(p => (p.id === id ? { ...p, visible: !visible } : p)))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <h1 className="font-head" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Projects</h1>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>Synced from GitHub · toggle what shows on your portfolio</p>
        </div>
        {configured && projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--amber)', background: '#1e1a0a', border: '1px solid #3d3010', padding: '6px 12px', borderRadius: '8px' }}>
            <GitBranch size={13} /> Synced with GitHub
          </div>
        )}
      </div>
      {loading ? (
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Loading projects…</div>
      ) : !configured ? (
        <div style={{ background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: '10px', padding: '40px 20px', textAlign: 'center' }}>
          <GitBranch size={24} style={{ color: 'var(--text3)', marginBottom: '10px' }} />
          <div className="font-head" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Connect your GitHub</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto' }}>
            Set <code style={{ color: 'var(--text2)' }}>GITHUB_USERNAME</code> (and optionally <code style={{ color: 'var(--text2)' }}>GITHUB_TOKEN</code>) in your environment, then redeploy. Your public repositories will appear here to curate for your portfolio.
          </div>
        </div>
      ) : error ? (
        <div style={{ background: 'var(--card)', border: '1px solid #401010', borderRadius: '10px', padding: '20px', fontSize: '12px', color: '#b05050' }}>
          Couldn’t reach GitHub: {error}. Check the username/token and try again.
        </div>
      ) : projects.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No public repositories found for that account.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onToggle={(v) => toggleVisibility(project.id, v)} />
          ))}
        </div>
      )}
    </div>
  )
}
