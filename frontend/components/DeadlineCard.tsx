import { Calendar, AlertCircle, CheckCircle } from 'lucide-react'

type DeadlineCardProps = {
  deadline: {
    id: string
    title: string
    company: string
    days_remaining: number
    urgency_level: 'urgent' | 'warning' | 'normal'
    already_applied: boolean
    category?: string
    prize_pool?: string
    url: string
  }
  onSnooze: () => void
  onApplied: () => void
}

export function DeadlineCard({ deadline, onSnooze, onApplied }: DeadlineCardProps) {
  const urgencyColors = {
    urgent: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    normal: 'bg-teal-50 border-teal-200 text-teal-800'
  }

  const urgencyIcons = {
    urgent: '⚡',
    warning: '📅',
    normal: '🕐'
  }

  return (
    <div className={`
      min-w-[320px] p-4 rounded-lg border-2 
      ${urgencyColors[deadline.urgency_level]}
      hover:shadow-lg transition-shadow cursor-pointer
      flex flex-col gap-3
    `}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{urgencyIcons[deadline.urgency_level]}</span>
          <div>
            <div className="font-semibold text-sm">
              {deadline.days_remaining} day{deadline.days_remaining !== 1 ? 's' : ''}
            </div>
            <div className="text-xs opacity-70">remaining</div>
          </div>
        </div>
        {deadline.already_applied && (
          <CheckCircle className="w-5 h-5 text-green-600" />
        )}
      </div>

      {/* Content */}
      <div>
        <h3 className="font-bold text-base mb-1">{deadline.title}</h3>
        <p className="text-sm opacity-80">{deadline.company}</p>
        {deadline.prize_pool && (
          <p className="text-xs mt-1">🏆 {deadline.prize_pool}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {!deadline.already_applied ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApplied()
              }}
              className="flex-1 px-3 py-2 bg-white text-gray-800 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              I applied!
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSnooze()
              }}
              className="px-3 py-2 bg-white/50 text-gray-700 rounded text-sm hover:bg-white/70 transition-colors"
            >
              Snooze
            </button>
          </>
        ) : (
          <a
            href={deadline.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-2 bg-white text-gray-800 rounded text-sm font-medium hover:bg-gray-100 transition-colors text-center"
            onClick={(e) => e.stopPropagation()}
          >
            View →
          </a>
        )}
      </div>
    </div>
  )
}
