'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DashboardDeadline } from '@/lib/api-client'

export function DeadlineCalendar({ deadlines }: { deadlines: DashboardDeadline[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startingDayOfWeek = firstDay.getDay()
  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const deadlinesForDay = (day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return deadlines.filter(deadline => deadline.deadline === date)
  }

  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Deadline calendar</h2>
          <p className="text-sm text-muted-foreground">All application milestones, not just the final date.</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            aria-label="Previous month"
            className="rounded-lg p-2 transition hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            aria-label="Next month"
            className="rounded-lg p-2 transition hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-4 text-center font-semibold">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>
        ))}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-16 sm:min-h-20" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const dayDeadlines = deadlinesForDay(day)
          return (
            <div
              key={day}
              className={`group relative min-h-16 rounded-lg border p-1.5 transition sm:min-h-20 ${
                dayDeadlines.length ? 'border-primary/20 bg-primary/5' : 'border-transparent hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">{day}</div>
              <div className="mt-1 space-y-1">
                {dayDeadlines.slice(0, 2).map(deadline => (
                  <div
                    key={deadline.id}
                    className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      deadline.urgency_level === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : deadline.urgency_level === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                    title={`${deadline.company}: ${deadline.label}`}
                  >
                    {deadline.label}
                  </div>
                ))}
                {dayDeadlines.length > 2 && (
                  <div className="text-[10px] text-muted-foreground">+{dayDeadlines.length - 2} more</div>
                )}
              </div>
              {dayDeadlines.length > 0 && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-xl bg-slate-950 p-3 text-xs text-white shadow-xl group-hover:block">
                  {dayDeadlines.map(deadline => (
                    <div key={deadline.id} className="py-1">
                      <div className="font-semibold">{deadline.label}</div>
                      <div className="text-slate-300">{deadline.company} · {deadline.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground">
        <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-500" />Due within 3 days</span>
        <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />Due within 7 days</span>
        <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" />Later</span>
      </div>
    </section>
  )
}
