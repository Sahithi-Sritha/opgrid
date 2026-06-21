'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Deadline = {
  id: string
  title: string
  company: string
  deadline: string
  urgency_level: string
  already_applied: boolean
}

export function DeadlineCalendar({ deadlines }: { deadlines: Deadline[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  const getDeadlinesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return deadlines.filter(d => d.deadline === dateStr)
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1))
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Deadline Calendar</h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="text-center mb-4 font-semibold">
        {monthNames[month]} {year}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayDeadlines = getDeadlinesForDay(day)
          const hasUrgent = dayDeadlines.some(d => d.urgency_level === 'urgent')
          const hasWarning = dayDeadlines.some(d => d.urgency_level === 'warning')
          const hasApplied = dayDeadlines.some(d => d.already_applied)

          return (
            <div
              key={day}
              className="aspect-square p-1 text-center relative hover:bg-muted rounded cursor-pointer group"
            >
              <div className="text-sm">{day}</div>
              
              {/* Dots */}
              {dayDeadlines.length > 0 && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                  {hasUrgent && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  {hasWarning && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  {hasApplied && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </div>
              )}

              {/* Tooltip on hover */}
              {dayDeadlines.length > 0 && (
                <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                  {dayDeadlines.map(d => (
                    <div key={d.id}>
                      {d.title} - {d.company}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Urgent (≤3 days)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Upcoming (4-7 days)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Applied</span>
        </div>
      </div>
    </div>
  )
}
