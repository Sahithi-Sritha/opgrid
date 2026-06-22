'use client'

import { AlertCircle, Bell, CheckCircle, FileText, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/lib/api-client'

export function ActivityFeed({ activities }: { activities: Notification[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'new_batch':
        return <Plus className="h-5 w-5 text-blue-600" />
      case 'deadline':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'applied':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'follow_up_due':
        return <Bell className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">Recent activity</h2>
      {activities.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No recent activity yet.</div>
      ) : (
        <div className="space-y-2">
          {activities.slice(0, 12).map(activity => (
            <div key={activity.id} className="flex gap-3 rounded-xl p-3 transition hover:bg-muted/50">
              <div className="mt-0.5 shrink-0">{getIcon(activity.type)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{activity.title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{activity.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
