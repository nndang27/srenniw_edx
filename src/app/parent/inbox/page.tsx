'use client'
import { useEffect, useState } from 'react'
import { useApi } from '@/lib/api'
import { createBrowserClient } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import NotificationCard from '@/components/parent/NotificationCard'
import type { Notification } from '@/types'

export default function ParentInboxPage() {
  const api = useApi()
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchInbox = () => {
    api.getInbox()
      .then(({ items, unread_count }) => {
        setNotifications(items)
        setUnreadCount(unread_count)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchInbox() }, [])

  useEffect(() => {
    if (!user?.id) return
    const supabase = createBrowserClient()
    // Use Broadcast — no Realtime publication config needed, no RLS issues
    const channel = supabase.channel(`notifications:${user.id}`)
      .on('broadcast', { event: 'new_notification' }, () => fetchInbox())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const handleRead = async (notifId: string) => {
    await api.markRead(notifId)
    setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleFeedback = async (briefId: string, message: string) => {
    await api.submitFeedback(briefId, message)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#333]">Inbox</h1>
        {unreadCount > 0 && (
          <span className="bg-[#446dd5] text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-[#eeeeee] rounded-2xl h-28 bg-white animate-pulse" />
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#dde6ff] rounded-2xl bg-white">
            <p className="text-base font-medium text-[#333] mb-1">No messages yet</p>
            <p className="text-sm text-[#999]">Your child's teacher will send updates here.</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationCard key={n.notification_id} notification={n} onRead={handleRead} onFeedback={handleFeedback} />
          ))
        )}
      </div>
    </div>
  )
}
