import { CalendarDays, Check, ExternalLink, Loader2 } from 'lucide-react'
import type { DashboardDeadline } from '@/lib/api-client'

type DeadlineCardProps = {
  deadline: DashboardDeadline
  saving?: boolean
  onApplied: () => void
  onComplete: () => void
}

export function DeadlineCard({ deadline, saving, onApplied, onComplete }: DeadlineCardProps) {
  const urgencyColors = {
    urgent: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    normal: 'border-blue-200 bg-blue-50 text-blue-900',
  }
  const timing = deadline.days_remaining === 0
    ? 'Due today'
    : deadline.days_remaining === 1
      ? 'Due tomorrow'
      : `${deadline.days_remaining} days left`

  return (
    <article className={`flex min-w-[300px] max-w-[340px] flex-col gap-3 rounded-2xl border p-4 ${urgencyColors[deadline.urgency_level]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-full bg-white/75 px-2.5 py-1 text-xs font-bold">{timing}</div>
        <span className="rounded-full bg-white/60 px-2 py-1 text-[11px] font-semibold capitalize">
          {deadline.status.replaceAll('_', ' ')}
        </span>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wide opacity-65">{deadline.label}</div>
        <h3 className="mt-1 font-bold">{deadline.title}</h3>
        <p className="text-sm opacity-75">{deadline.company}</p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <CalendarDays className="h-4 w-4" />
        {new Date(`${deadline.deadline}T00:00:00`).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </div>
      <div className="mt-auto flex gap-2 pt-1">
        {!deadline.already_applied ? (
          <button
            onClick={onApplied}
            className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white/80"
          >
            I applied
          </button>
        ) : deadline.can_complete ? (
          <button
            onClick={onComplete}
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white/80 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Mark complete
          </button>
        ) : null}
        {deadline.url && /^https?:\/\//i.test(deadline.url) && (
          <a
            href={deadline.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open opportunity"
            className="rounded-lg bg-white/70 p-2.5 text-slate-800 transition hover:bg-white"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  )
}
