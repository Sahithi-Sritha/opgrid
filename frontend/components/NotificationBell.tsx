'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    loadNotifications()
    subscribeToNotifications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.length)
    }
  }

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(c => c + 1)
        
        // Show toast notification
        showToast(payload.new)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const showToast = (notification: any) => {
    // Simple toast (you can replace with a proper toast library)
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm'
    toast.innerHTML = `
      <div class="font-semibold">${notification.title}</div>
      <div class="text-sm opacity-90">${notification.body}</div>
    `
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transition = 'opacity 0.3s'
      setTimeout(() => toast.remove(), 300)
    }, 5000)
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)

    setNotifications([])
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      deadline: '⏰',
      new_batch: '✨',
      applied: '✅',
      follow_up_due: '👋',
      registration_closing: '⏰'
    }
    return icons[type] || '📢'
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border rounded-lg shadow-xl z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No new notifications
              </div>
            ) : (
              <div>
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className="p-4 border-b hover:bg-muted/50 cursor-pointer flex gap-3"
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-muted-foreground">{notif.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
