'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, ChevronLeft } from 'lucide-react'
import { useApi } from '@/lib/api'

export default function TeacherChatBubble() {
  const api = useApi()
  const [open, setOpen] = useState(false)
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [convs, setConvs] = useState<any[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleOpenChat = () => setOpen(true)
    window.addEventListener('open-teacher-chat', handleOpenChat)
    return () => window.removeEventListener('open-teacher-chat', handleOpenChat)
  }, [])

  useEffect(() => {
    if (!open) return
    api.getChatRooms('teacher')
      .then(setConvs)
      .catch(console.error)
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        bubbleRef.current && !bubbleRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const [draft, setDraft] = useState('')

  const activeData = convs.find((c: any) => c.room_id === activeConv || c.id === activeConv)
  const unreadCount = convs.filter((c: any) => (c.unread_count ?? 0) > 0).length

  return (
    <>
      {/* Floating bubble */}
      <button
        ref={bubbleRef}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white ring-2 ring-blue-400 shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Open parent chat"
      >
        <MessageCircle size={24} className="text-blue-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div ref={panelRef} className="fixed bottom-24 right-6 z-50 w-80 h-[480px] bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            {activeConv ? (
              <>
                <button onClick={() => setActiveConv(null)} className="flex items-center gap-1.5 text-blue-500 text-sm font-semibold">
                  <ChevronLeft size={16} /> Back
                </button>
                <span className="text-sm font-bold text-slate-800 truncate">{activeData?.parentName}</span>
                <div className="w-16" />
              </>
            ) : (
              <>
                <span className="font-bold text-slate-800 text-sm">Parent Messages</span>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
              </>
            )}
          </div>

          {!activeConv ? (
            /* Conversation list */
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {convs.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">No conversations yet.</p>
              )}
              {convs.map((conv: any) => {
                const roomId = conv.room_id || conv.id
                const hasUnread = (conv.unread_count ?? 0) > 0
                const lastMsg = conv.last_message ?? ''
                const lastTime = conv.last_message_at
                  ? new Date(conv.last_message_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
                  : ''
                const parentId = conv.parent_clerk_id ?? roomId
                return (
                  <a
                    key={roomId}
                    href={`/teacher/chat?room=${roomId}`}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(parentId)}`}
                      alt="Parent"
                      className="w-10 h-10 rounded-full bg-blue-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-semibold truncate ${hasUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {conv.parent_name || 'Parent'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">{lastTime}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{lastMsg || 'Start a conversation'}</p>
                    </div>
                    {hasUnread && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />}
                  </a>
                )
              })}
            </div>
          ) : (
            /* Redirect to full chat page */
            <>
              <div className="flex-1 flex items-center justify-center p-4">
                <a href={`/teacher/chat?room=${activeConv}`} className="text-blue-500 text-sm font-semibold underline">
                  Open full chat →
                </a>
              </div>
              <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex items-center gap-2 shrink-0">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"
                />
                <button
                  disabled={!draft.trim()}
                  className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
