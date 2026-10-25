import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'OpGrid - Opportunity Aggregator',
  description: 'Track internships and job opportunities from multiple sources',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body><AuthProvider><AppShell>{children}</AppShell></AuthProvider></body>
    </html>
  )
}
