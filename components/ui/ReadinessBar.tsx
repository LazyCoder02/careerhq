interface ReadinessBarProps {
  score: number
  height?: number
}

export default function ReadinessBar({ score, height = 6 }: ReadinessBarProps) {
  return (
    <div style={{ background: 'var(--card2)', borderRadius: '4px', height: `${height}px`, overflow: 'hidden', marginTop: '6px' }}>
      <div style={{ height: '100%', borderRadius: '4px', background: 'var(--amber)', width: `${score}%`, transition: 'width 0.6s ease' }} />
    </div>
  )
}
