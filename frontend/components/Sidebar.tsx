'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { FileText, LayoutDashboard, ListChecks, LogOut, Newspaper, Settings } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

type AgentState = 'checking' | 'online' | 'offline'

export function Sidebar() {
  const pathname = usePathname()
  const [agentState, setAgentState] = useState<AgentState>('checking')
  const { signOut } = useAuth()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/feed', label: 'Feed', icon: Newspaper },
    { href: '/tracker', label: 'Tracker', icon: ListChecks },
    { href: '/resume', label: 'Resume', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  useEffect(() => {
    let active = true

    const checkHealth = async () => {
      const { data, error } = await apiClient.getHealth()
      if (active) setAgentState(!error && data?.status === 'ok' ? 'online' : 'offline')
    }

    void checkHealth()
    const interval = window.setInterval(checkHealth, 30_000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  const statusLabel = {
    checking: 'Checking',
    online: 'Agent online',
    offline: 'Agent offline',
  }[agentState]

  return (
    <aside className="flex w-20 shrink-0 flex-col border-r bg-card/95 backdrop-blur lg:w-64">
      <div className="px-3 py-6 lg:px-6">
        <h1 className="text-center text-xl font-bold tracking-tight lg:text-left lg:text-2xl">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <span className="lg:hidden">OG</span>
            <span className="hidden lg:inline">OpGrid</span>
          </span>
        </h1>
        <p className="mt-1 hidden text-xs text-muted-foreground lg:block">Opportunity aggregator</p>
      </div>

      <nav className="flex-1 px-2 lg:px-3" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`mb-1 flex items-center justify-center gap-3 rounded-xl px-3 py-3 transition-colors lg:justify-start lg:px-4 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden font-medium lg:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3 lg:p-4">
        <div
          className="flex items-center justify-center gap-2 rounded-xl bg-muted/70 px-2 py-3 text-xs lg:justify-start"
          title={statusLabel}
        >
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              agentState === 'online'
                ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
                : agentState === 'offline'
                  ? 'bg-red-500'
                  : 'animate-pulse bg-amber-400'
            }`}
          />
          <span className="hidden font-medium lg:inline">{statusLabel}</span>
        </div>
        <button onClick={() => void signOut()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground lg:justify-start" title="Sign out"><LogOut className="h-4 w-4" /><span className="hidden lg:inline">Sign out</span></button>
      </div>
    </aside>
  )
}
