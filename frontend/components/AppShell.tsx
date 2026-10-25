'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { NotificationBell } from '@/components/NotificationBell'
import { CommandPalette } from '@/components/CommandPalette'
import { OpportunitySlideOver } from '@/components/OpportunitySlideOver'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/auth')) return <>{children}</>
  return <><div className="flex h-screen bg-background"><Sidebar /><div className="flex-1 flex flex-col overflow-hidden"><div className="border-b bg-card px-6 py-3 flex items-center justify-end"><NotificationBell /></div><main className="flex-1 overflow-y-auto">{children}</main></div></div><CommandPalette /><OpportunitySlideOver /></>
}
