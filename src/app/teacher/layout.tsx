'use client'
import { Poppins } from 'next/font/google'
import { UserButton } from '@clerk/nextjs'
import { Settings, Bell, X } from 'lucide-react'
import { useState } from 'react'
import TeacherSettingsModal from './_components/TeacherSettingsModal'
import TeacherChatBubble from './_components/TeacherChatBubble'

const poppins = Poppins({ subsets: ['latin'], weight: ['800'] })

interface MockNotification {
  id: number
  title: string
  body: string
  time: string
  read: boolean
  icon: string
}

const INITIAL_NOTIFICATIONS: MockNotification[] = [
  { id: 1, title: 'New journal entry', body: "Sarah Watson submitted Emily's journal for today.", time: '10 min ago', read: false, icon: '📓' },
  { id: 2, title: 'Parent message', body: "Michael O'Brien sent you a message about James.", time: '1 hr ago', read: false, icon: '💬' },
  { id: 3, title: 'Weekly summary ready', body: 'Your class cognitive report for Week 8 is ready to view.', time: '2 hrs ago', read: false, icon: '📊' },
  { id: 4, title: 'Curriculum reminder', body: 'Week 9 topics have not been uploaded yet.', time: 'Yesterday', read: true, icon: '📅' },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-violet-50/30">
      {/* Header — Liquid Glass */}
      <div className="px-5 py-3 backdrop-blur-xl bg-white/60 border-b border-white/50 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <span className={`${poppins.className} font-extrabold text-xl bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent tracking-tight`}>
          LearnBridge
        </span>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setBellOpen(o => !o)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {bellOpen && (
              <div className="absolute right-0 top-10 w-80 bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-bold text-slate-800 text-sm">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] font-semibold text-blue-500 hover:underline">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setBellOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
                      className={`w-full flex items-start gap-3 px-4 py-3 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors
                        ${!n.read ? 'bg-blue-50/40' : ''}`}
                    >
                      <span className="text-lg shrink-0">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${!n.read ? 'text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[10px] text-slate-300 mt-1">{n.time}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                    </button>
                  ))}
                </div>
                {notifications.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-8">All caught up! 🎉</p>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
          <UserButton />
        </div>
      </div>

      <div className="flex-1">
        {children}
      </div>

      <TeacherChatBubble />
      <TeacherSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
