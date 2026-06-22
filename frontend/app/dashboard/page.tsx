'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle, Clock, RefreshCw, Target, TrendingUp } from 'lucide-react'
import { apiClient, type DashboardData, type DashboardDeadline } from '@/lib/api-client'
import { DeadlineCard } from '@/components/DeadlineCard'
import { StatsCard } from '@/components/StatsCard'
import { ActivityFeed } from '@/components/ActivityFeed'
import { DeadlineCalendar } from '@/components/DeadlineCalendar'

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingDeadline, setSavingDeadline] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: requestError } = await apiClient.getDashboard()
    if (requestError) setError(requestError.message)
    else setDashboard(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const urgentDeadlines = useMemo(
    () => (dashboard?.deadlines || [])
      .filter(deadline => deadline.days_remaining >= 0 && deadline.days_remaining <= 14)
      .slice(0, 12),
    [dashboard],
  )

  const handleApplied = async (deadline: DashboardDeadline) => {
    const { error: requestError } = await apiClient.markApplied(deadline.opportunity_id)
    if (requestError) setError(requestError.message)
    else await loadDashboard()
  }

  const handleComplete = async (deadline: DashboardDeadline) => {
    if (!deadline.application_id || !deadline.deadline_id) return
    setSavingDeadline(deadline.id)
    const { error: requestError } = await apiClient.updateApplicationDeadline(
      deadline.application_id,
      deadline.deadline_id,
      { completed: true },
    )
    if (requestError) setError(requestError.message)
    else await loadDashboard()
    setSavingDeadline(null)
  }

  if (loading && !dashboard) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading your command center…
        </div>
      </div>
    )
  }

  const stats = dashboard?.stats

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">
            Every application, milestone, and deadline in one place.
          </p>
        </div>
        <button
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 font-medium transition hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Opportunities"
          value={stats?.total_opportunities || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          sparkline={dashboard?.sparkline}
          color="blue"
        />
        <StatsCard
          title="Tracked This Week"
          value={stats?.applications_this_week || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Deadlines Next 7 Days"
          value={stats?.deadlines_next_7_days || 0}
          icon={<Clock className="h-5 w-5" />}
          color={(stats?.deadlines_next_7_days || 0) > 3 ? 'red' : 'amber'}
          alert={(stats?.deadlines_next_7_days || 0) > 3}
        />
        <StatsCard
          title="Active Pipeline"
          value={stats?.active_pipeline || 0}
          icon={<Target className="h-5 w-5" />}
          color="purple"
        />
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Upcoming deadlines</h2>
            <p className="text-sm text-muted-foreground">The next 14 days across all tracked milestones.</p>
          </div>
          <div className="text-sm text-muted-foreground">{urgentDeadlines.length} upcoming</div>
        </div>
        {urgentDeadlines.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nothing due in the next 14 days. A rare and beautiful sight.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {urgentDeadlines.map(deadline => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                saving={savingDeadline === deadline.id}
                onApplied={() => void handleApplied(deadline)}
                onComplete={() => void handleComplete(deadline)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DeadlineCalendar deadlines={dashboard?.deadlines || []} />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed activities={dashboard?.activities || []} />
        </div>
      </div>
    </div>
  )
}
