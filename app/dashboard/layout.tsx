import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ marginLeft: '200px', flex: 1, padding: '28px', minHeight: '100vh', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
