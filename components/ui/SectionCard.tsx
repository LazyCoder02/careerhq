interface SectionCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function SectionCard({ children, style }: SectionCardProps) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border2)',
      borderRadius: '10px',
      padding: '14px',
      ...style,
    }}>
      {children}
    </div>
  )
}
