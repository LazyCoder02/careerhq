'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Briefcase, FileText, Code2, Bot, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard',          label: 'Home',         icon: Home },
  { href: '/dashboard/jobs',     label: 'Job Tracker',  icon: Briefcase },
  { href: '/dashboard/resumes',  label: 'Your Resumes', icon: FileText },
  { href: '/dashboard/projects', label: 'Projects',     icon: Code2 },
  { href: '/dashboard/teal',     label: 'Teal',         icon: Bot, isTeal: true },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function Sidebar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<{ name: string; targetRole: string } | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => setProfile({ name: d.profile?.name ?? '', targetRole: d.profile?.targetRole ?? '' }))
      .catch(() => setProfile({ name: '', targetRole: '' }))
  }, [])

  const name = profile?.name?.trim() || 'Your profile'
  const subtitle = profile?.targetRole?.trim() || 'Upload your CV to start'

  return (
    <aside style={{
      width: '196px',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border2)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      flexShrink: 0,
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Logo */}
      <div className="font-head" style={{ fontSize: '15px', fontWeight: 700, padding: '0 18px 20px', letterSpacing: '-0.3px', color: 'var(--text)' }}>
        Career<span style={{ color: 'var(--amber)' }}>HQ</span>
      </div>

      {/* Profile chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', margin: '0 8px 16px', background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text2)', flexShrink: 0 }}>
          {profile ? initials(profile.name) : '—'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', padding: '0 8px' }}>
        {navItems.map(({ href, label, icon: Icon, isTeal }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '8px 10px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--text)' : 'var(--text3)',
                background: isActive ? 'var(--card)' : 'transparent',
                border: isActive ? '1px solid var(--border2)' : '1px solid transparent',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}>
                <Icon size={15} style={{ color: isActive ? 'var(--amber)' : undefined, flexShrink: 0 }} />
                {label}
                {isTeal && (
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: 'var(--amber)', marginLeft: 'auto',
                    animation: 'blink 2s infinite',
                  }} />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <div style={{ padding: '10px 8px 0', borderTop: '1px solid var(--border2)' }}>
        <Link href="/dashboard/settings" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            padding: '8px 10px', borderRadius: '7px',
            fontSize: '12px', color: 'var(--text3)', cursor: 'pointer',
          }}>
            <Settings size={14} />
            Settings
          </div>
        </Link>
      </div>
    </aside>
  )
}
