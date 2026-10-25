'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { apiClient } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'

type AuthContextValue = { session: Session | null; signOut: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname.startsWith('/auth')

  useEffect(() => {
    const applySession = (nextSession: Session | null) => {
      setSession(nextSession)
      apiClient.setAuthToken(nextSession?.access_token || null)
      setLoading(false)
    }
    void supabase.auth.getSession().then(({ data }) => applySession(data.session))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession))
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return
    if (!session && !isAuthPage) router.replace('/auth/sign-in')
    if (session && isAuthPage) router.replace('/dashboard')
  }, [isAuthPage, loading, router, session])

  const signOut = async () => {
    await supabase.auth.signOut()
    apiClient.setAuthToken(null)
    router.replace('/auth/sign-in')
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Restoring your session…</div>
  if (!session && !isAuthPage) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Redirecting to sign in…</div>

  return <AuthContext.Provider value={{ session, signOut }}>{children}</AuthContext.Provider>
}
