import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { NotificationBell } from '@/components/NotificationBell'
import { CommandPalette } from '@/components/CommandPalette'
import { OpportunitySlideOver } from '@/components/OpportunitySlideOver'

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
      <body>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar with Notification Bell */}
            <div className="border-b bg-card px-6 py-3 flex items-center justify-end">
              <NotificationBell />
            </div>
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
        
        {/* Global Components */}
        <CommandPalette />
        <OpportunitySlideOver />
      </body>
    </html>
  )
}
