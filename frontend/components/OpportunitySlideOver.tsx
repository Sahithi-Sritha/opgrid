'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, type Opportunity } from '@/lib/api-client'
import {
  Award,
  Bookmark,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { Badge } from './Badge'
import { formatDistanceToNow } from 'date-fns'

type ResumeVersion = {
  id: string
  label: string
  filename: string
  created_at: string
}

type ActionName = 'applied' | 'save' | 'reminder' | null

function hasExternalUrl(url?: string | null) {
  return Boolean(url && /^https?:\/\//i.test(url))
}

export function OpportunitySlideOver() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [similar, setSimilar] = useState<Opportunity[]>([])
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [activeAction, setActiveAction] = useState<ActionName>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)

  const loadSimilarOpportunities = useCallback(async (id: string) => {
    setLoadingSimilar(true)
    const { data } = await apiClient.getSimilarOpportunities(id)
    setSimilar(data || [])
    setLoadingSimilar(false)
  }, [])

  const loadResumeVersions = useCallback(async () => {
    const { data } = await apiClient.getResumeVersions()
    setResumeVersions((data?.resumes || []).slice(0, 5))
  }, [])

  const showOpportunity = useCallback(async (candidate: Opportunity) => {
    setOpportunity({ ...candidate, tags: candidate.tags || [] })
    setMessage(null)
    setSaved(false)
    setApplied(false)
    setLoadingDetails(true)

    const { data } = await apiClient.getOpportunityById(candidate.id)
    if (data) setOpportunity({ ...data, tags: data.tags || [] })

    setLoadingDetails(false)
    void loadSimilarOpportunities(candidate.id)
  }, [loadSimilarOpportunities])

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const candidate = (event as CustomEvent<Opportunity>).detail
      if (!candidate?.id) return
      setIsOpen(true)
      void showOpportunity(candidate)
      void loadResumeVersions()
    }

    window.addEventListener('open-opportunity', handleOpen)
    return () => window.removeEventListener('open-opportunity', handleOpen)
  }, [loadResumeVersions, showOpportunity])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const runAction = async (
    name: Exclude<ActionName, null>,
    action: () => Promise<{ error: Error | null }>,
    successMessage: string,
  ) => {
    setActiveAction(name)
    setMessage(null)
    const { error } = await action()
    setActiveAction(null)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return false
    }

    setMessage({ type: 'success', text: successMessage })
    return true
  }

  const handleApplied = async () => {
    if (!opportunity) return
    const success = await runAction(
      'applied',
      async () => apiClient.markApplied(opportunity.id),
      'Application tracked — nice work.',
    )
    if (success) setApplied(true)
  }

  const handleSaveForLater = async () => {
    if (!opportunity) return
    const success = await runAction(
      'save',
      async () => apiClient.saveOpportunity(opportunity.id),
      'Saved for later.',
    )
    if (success) setSaved(true)
  }

  const handleAnalyzeJD = () => {
    if (!opportunity) return
    const params = new URLSearchParams({ company: opportunity.company })
    if (hasExternalUrl(opportunity.url)) params.set('jd_url', opportunity.url)
    params.set('opp', opportunity.id)
    router.push(`/resume?${params.toString()}`)
    setIsOpen(false)
  }

  const handleSetReminder = async (days: number) => {
    if (!opportunity?.deadline) return
    const success = await runAction(
      'reminder',
      async () => apiClient.setOpportunityReminder(opportunity.id, days),
      `Reminder set for ${days === 1 ? '1 day' : `${days} days`} before the deadline.`,
    )
    if (success) setSaved(true)
  }

  if (!isOpen || !opportunity) return null

  const tags = opportunity.tags || []
  const daysUntilDeadline = opportunity.deadline
    ? Math.ceil((new Date(opportunity.deadline).getTime() - Date.now()) / 86_400_000)
    : null
  const externalUrlAvailable = hasExternalUrl(opportunity.url)

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="opportunity-title">
      <button
        type="button"
        aria-label="Close opportunity details"
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <section className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl">
        <header className="border-b bg-card/95 p-5 backdrop-blur sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md">
                {opportunity.company?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <h2 id="opportunity-title" className="text-balance text-xl font-bold leading-tight sm:text-2xl">
                  {opportunity.title}
                </h2>
                <p className="mt-1 text-muted-foreground">{opportunity.company}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="scrollbar-thin flex-1 space-y-7 overflow-y-auto p-5 sm:p-6">
          {loadingDetails && (
            <div className="flex items-center gap-2 rounded-xl border bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading the complete posting…
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag.replaceAll('_', ' ')}</Badge>
            ))}
            <Badge variant={opportunity.source === 'hackathon' ? 'blue' : 'default'}>
              {opportunity.source}
            </Badge>
            {opportunity.ppo_possible && <Badge variant="green">PPO possible</Badge>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {opportunity.location && (
              <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{opportunity.location}</span>
              </div>
            )}
            {opportunity.stipend && (
              <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span>{opportunity.stipend}</span>
              </div>
            )}
            {opportunity.prize_pool && (
              <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                <Award className="h-4 w-4 text-amber-600" />
                <span>{opportunity.prize_pool}</span>
              </div>
            )}
            {opportunity.team_size && (
              <div className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                <Users className="h-4 w-4 text-violet-600" />
                <span>Team: {opportunity.team_size}</span>
              </div>
            )}
          </div>

          {opportunity.deadline && daysUntilDeadline !== null && (
            <div className={`rounded-2xl border p-4 ${
              daysUntilDeadline < 0
                ? 'border-slate-200 bg-slate-50'
                : daysUntilDeadline <= 3
                  ? 'border-red-200 bg-red-50'
                  : 'border-orange-200 bg-orange-50'
            }`}>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-semibold">
                    {daysUntilDeadline < 0
                      ? 'Deadline passed'
                      : `${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} until deadline`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(opportunity.deadline).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-semibold">Description</h3>
            <div className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {opportunity.description || 'No description is available yet. Open the original posting for full details.'}
            </div>
          </div>

          {resumeVersions.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Resume match</h3>
              </div>
              <div className="space-y-2">
                {resumeVersions.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{resume.label || resume.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(`/resume?analyze=${resume.id}&opp=${opportunity.id}`)
                        setIsOpen(false)
                      }}
                      className="shrink-0 text-xs font-semibold text-primary hover:underline"
                    >
                      Analyze match
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-semibold">Similar opportunities</h3>
            {loadingSimilar ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding related opportunities…
              </div>
            ) : similar.length > 0 ? (
              <div className="space-y-2">
                {similar.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => void showOpportunity(item)}
                    className="w-full rounded-xl border bg-card p-3 text-left transition hover:border-primary/30 hover:bg-blue-50"
                  >
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{item.company}</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No close matches found yet.</p>
            )}
          </div>
        </div>

        <footer className="border-t bg-card p-4 sm:p-6">
          {message && (
            <div
              aria-live="polite"
              className={`mb-3 rounded-xl px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleApplied}
              disabled={Boolean(activeAction) || applied}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activeAction === 'applied' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {applied ? 'Applied' : 'I applied'}
            </button>

            {externalUrlAvailable ? (
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                Open posting <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="This opportunity does not have a public posting URL"
                className="rounded-xl border-2 px-4 py-3 text-sm font-semibold text-muted-foreground opacity-60"
              >
                No public link
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSaveForLater}
              disabled={Boolean(activeAction) || saved}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activeAction === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
              {saved ? 'Saved' : 'Save for later'}
            </button>
            <button
              type="button"
              onClick={handleAnalyzeJD}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
            >
              <Sparkles className="h-4 w-4" />
              Analyze JD
            </button>
          </div>

          {opportunity.deadline && daysUntilDeadline !== null && daysUntilDeadline >= 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Remind me before the deadline
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 7].map((days) => (
                  <button
                    type="button"
                    key={days}
                    onClick={() => handleSetReminder(days)}
                    disabled={Boolean(activeAction)}
                    className="rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
                  >
                    {days === 1 ? '1 day' : `${days} days`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </footer>
      </section>
    </div>
  )
}
