import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CareerHQ',
  description: 'Personal job tracking, CV management and AI career assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
