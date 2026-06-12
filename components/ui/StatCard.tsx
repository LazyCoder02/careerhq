interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border2)',
      borderLeft: accent ? '2px solid var(--amber)' : undefined,
      borderRadius: '9px',
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>
        {label}
      </div>
      <div className="font-head" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{sub}</div>
      )}
    </div>
  )
}
