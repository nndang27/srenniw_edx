'use client'
import { useState } from 'react'
import type { Notification, Activity } from '@/types'
import { formatDate } from '@/lib/utils'
import { Clock, Reply, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  notification: Notification
  onRead: (id: string) => void
  onFeedback: (briefId: string, message: string) => void
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-xl p-3.5 border border-[#eeeeee]">
      <div className="bg-[#eef2ff] rounded-lg p-2 shrink-0">
        <Clock size={14} className="text-[#446dd5]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#333]">{activity.title}</p>
        <p className="text-sm text-[#666] mt-0.5 leading-relaxed">{activity.description}</p>
        <span className="inline-block mt-1.5 text-xs font-medium bg-[#eef2ff] text-[#446dd5] px-2 py-0.5 rounded-lg">
          {activity.duration_mins} min
        </span>
      </div>
    </div>
  )
}

export default function NotificationCard({ notification, onRead, onFeedback }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { brief } = notification
  const router = useRouter()

  const handleOpen = () => {
    if (!notification.is_read) onRead(notification.notification_id)

    // Deep link to specific day and subject if available
    if (brief.date && brief.subject) {
      router.push(`/parent/day/${brief.date}/${brief.subject}`)
    } else {
      setExpanded(prev => !prev)
    }
  }

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) return
    onFeedback(brief.id, feedbackText)
    setSubmitted(true)
    setFeedbackText('')
  }

  const activities = brief.at_home_activities || []
  const contentTypeLabel: Record<string, string> = {
    assignment: 'Assignment',
    comment: 'Message',
    weekly_update: 'Weekly Update',
  }

  return (
    <div className={`border rounded-2xl overflow-hidden bg-white transition-all duration-200 ${notification.is_read ? 'border-[#eeeeee]' : 'border-[#c3d3fb] shadow-sm'
      }`}>
      <button onClick={handleOpen} className="w-full text-left p-5 hover:bg-[#f7f8fc] transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {!notification.is_read && (
              <div data-testid="unread-indicator" className="w-2.5 h-2.5 rounded-full bg-[#446dd5] shrink-0 mt-0.5" />
            )}
            <span className="text-xs font-semibold text-[#446dd5] bg-[#eef2ff] px-2.5 py-1 rounded-lg">
              {contentTypeLabel[brief.content_type] || brief.content_type}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#999]">{formatDate(notification.created_at)}</span>
            {brief.date && brief.subject ? <ChevronRight size={14} className="text-[#999]" /> : (expanded ? <ChevronDown size={14} className="text-[#999] rotate-180" /> : <ChevronDown size={14} className="text-[#999]" />)}
          </div>
        </div>
        <p className="mt-3 text-sm text-[#555] leading-relaxed line-clamp-3">
          {brief.content || brief.processed_en || 'Loading…'}
        </p>
        {activities.length > 0 && (
          <p className="text-xs font-medium text-[#446dd5] mt-2">
            {activities.length} at-home {activities.length === 1 ? 'activity' : 'activities'}
          </p>
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#eeeeee] bg-[#f7f8fc]">
          <div className="pt-4 pb-4">
            <p className="text-sm text-[#555] leading-relaxed">
              {brief.content || brief.processed_en}
            </p>
          </div>

          {activities.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-[#666] uppercase tracking-wide mb-2.5">At-home Activities</h3>
              <div className="space-y-2">
                {activities.map((act, i) => <ActivityCard key={i} activity={act} />)}
              </div>
            </div>
          )}

          {!showFeedback && !submitted && (
            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-1.5 text-sm text-[#446dd5] font-medium hover:text-[#315bcf] transition-colors"
            >
              <Reply size={14} />
              Reply to teacher
            </button>
          )}

          {showFeedback && !submitted && (
            <div className="space-y-2">
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Write a reply to the teacher…"
                rows={3}
                className="w-full border border-[#eeeeee] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#446dd5] resize-none bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim()}
                  className="px-4 py-2 bg-[#446dd5] text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-[#315bcf] transition-colors"
                >
                  Send Reply
                </button>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="px-4 py-2 text-sm text-[#999] hover:text-[#333] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {submitted && (
            <p className="text-sm text-[#446dd5] font-semibold">Reply sent!</p>
          )}
        </div>
      )}
    </div>
  )
}
