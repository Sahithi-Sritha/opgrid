'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DeadlineCard } from '@/components/DeadlineCard'
import { StatsCard } from '@/components/StatsCard'
import { ActivityFeed } from '@/components/ActivityFeed'
import { DeadlineCalendar } from '@/components/DeadlineCalendar'
import { TrendingUp, CheckCircle, Clock, Target } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export default function DashboardPage() {
  const [urgentDeadlines, setUrgentDeadlines] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [sparklineData, setSparklineData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get urgent deadlines
      const { data: deadlines } = await supabase
        .rpc('get_urgent_deadlines', { days_ahead: 14 })

      setUrgentDeadlines(deadlines || [])

      // Get dashboard stats
      const { data: statsData } = await supabase.rpc('get_dashboard_stats')
      setStats(statsData)

      // Get sparkline data
      const { data: sparkline } = await supabase.rpc('get_scraping_sparkline', { days: 7 })
      setSparklineData(sparkline || [])

    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSnooze = async (opportunityId: string) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    await supabase
      .from('opportunities')
      .update({ seen_at: tomorrow.toISOString() })
      .eq('id', opportunityId)

    // Remove from urgent list
    setUrgentDeadlines(prev => prev.filter(d => d.id !== opportunityId))
  }

  const handleApplied = async (opportunityId: string) => {
    await apiClient.markApplied(opportunityId)

    // Refresh dashboard
    loadDashboardData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Command Center</h1>
        <p className="text-muted-foreground">
          Your opportunity tracking dashboard
        </p>
      </div>

      {/* Urgency Strip - Horizontal Scrollable */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">⚡ Urgent Deadlines</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {urgentDeadlines.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No urgent deadlines in the next 14 days
            </div>
          ) : (
            urgentDeadlines.map(deadline => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                onSnooze={() => handleSnooze(deadline.id)}
                onApplied={() => handleApplied(deadline.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Opportunities"
          value={stats?.total_opportunities || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          sparkline={sparklineData}
          color="blue"
        />
        <StatsCard
          title="Applied This Week"
          value={stats?.applications_this_week || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Deadlines Next 7 Days"
          value={stats?.deadlines_next_week || 0}
          icon={<Clock className="w-5 h-5" />}
          color={stats?.deadlines_next_week > 3 ? 'red' : 'amber'}
          alert={stats?.deadlines_next_week > 3}
        />
        <StatsCard
          title="Active Pipeline"
          value={stats?.active_pipeline || 0}
          icon={<Target className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>

        {/* Deadline Calendar - Takes 1 column */}
        <div>
          <DeadlineCalendar deadlines={urgentDeadlines} />
        </div>
      </div>
    </div>
  )
}
