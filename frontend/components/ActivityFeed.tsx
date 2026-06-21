'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Plus, CheckCircle, AlertCircle, FileText } from 'lucide-react'

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      // Get recent notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      setActivities(notifications || [])
    } catch (error) {
      console.error('Activity feed error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_batch':
        return <Plus className="w-5 h-5 text-blue-600" />
      case 'deadline':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      case 'applied':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'follow_up_due':
        return <Bell className="w-5 h-5 text-purple-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const groupByTime = (activities: any[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    return {
      today: activities.filter(a => new Date(a.created_at) >= today),
      thisWeek: activities.filter(a => {
        const date = new Date(a.created_at)
        return date < today && date >= weekAgo
      }),
      earlier: activities.filter(a => new Date(a.created_at) < weekAgo)
    }
  }

  const grouped = groupByTime(activities)

  if (loading) {
    return <div className="text-muted-foreground">Loading activity...</div>
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

      <div className="space-y-6">
        {grouped.today.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Today</h3>
            <div className="space-y-3">
              {grouped.today.map(activity => (
                <ActivityItem key={activity.id} activity={activity} getIcon={getIcon} />
              ))}
            </div>
          </div>
        )}

        {grouped.thisWeek.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">This Week</h3>
            <div className="space-y-3">
              {grouped.thisWeek.map(activity => (
                <ActivityItem key={activity.id} activity={activity} getIcon={getIcon} />
              ))}
            </div>
          </div>
        )}

        {grouped.earlier.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Earlier</h3>
            <div className="space-y-3">
              {grouped.earlier.map(activity => (
                <ActivityItem key={activity.id} activity={activity} getIcon={getIcon} />
              ))}
            </div>
          </div>
        )}

        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityItem({ activity, getIcon }: any) {
  return (
    <div className="flex gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{activity.title}</p>
        <p className="text-sm text-muted-foreground">{activity.body}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
