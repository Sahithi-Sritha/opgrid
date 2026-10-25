'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SignInPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'reset'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/sign-in` })
      if (error) setError(error.message); else setMessage('Check your inbox for a password-reset link.')
    } else if (mode === 'sign-up') {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/sign-in` } })
      if (error) setError(error.message); else setMessage('Account created. Confirm your email, then sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setBusy(false)
  }

  const title = mode === 'sign-up' ? 'Create your OpGrid account' : mode === 'reset' ? 'Reset your password' : 'Welcome back to OpGrid'
  return <main className="grid min-h-screen place-items-center p-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-lg">
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="mt-2 text-sm text-muted-foreground">Your applications, resumes, and reminders stay private to your account.</p>
    <label className="mt-6 block text-sm font-medium">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3" /></label>
    {mode !== 'reset' && <label className="mt-4 block text-sm font-medium">Password<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-lg border bg-background px-3" /></label>}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}{message && <p className="mt-4 text-sm text-green-700">{message}</p>}
    <button disabled={busy} className="mt-6 h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-60">{busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</button>
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm"><button type="button" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')} className="text-primary hover:underline">{mode === 'sign-in' ? 'Create an account' : 'Sign in instead'}</button><button type="button" onClick={() => setMode('reset')} className="text-primary hover:underline">Forgot password?</button></div>
  </form></main>
}
