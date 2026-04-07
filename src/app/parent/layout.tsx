'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, TrendingUp, Lightbulb, Settings, Bell, X } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { Poppins } from 'next/font/google'
import CommunicationHub from '@/components/shared/CommunicationHub'
import SettingsModal from '@/components/shared/SettingsModal'

const poppins = Poppins({ subsets: ['latin'], weight: ['800'] })

const navItems = [
  { id: 'calendar',  label: 'Calendar',  icon: CalendarDays },
  { id: 'transcript', label: 'Transcript', icon: TrendingUp },
  { id: 'progress',  label: 'Progress',  icon: TrendingUp },
  { id: 'insights',  label: 'Insights',  icon: Lightbulb },
] as const

type SectionId = typeof navItems[number]['id']

const sectionColors: Record<SectionId, { active: string; ring: string }> = {
  calendar: { active: 'bg-blue-500 text-white shadow-blue-200', ring: 'ring-2 ring-blue-300/40' },
  transcript: { active: 'bg-indigo-500 text-white shadow-indigo-200', ring: 'ring-2 ring-indigo-300/40' },
  progress:  { active: 'bg-violet-500 text-white shadow-violet-200', ring: 'ring-2 ring-violet-300/40' },
  insights:  { active: 'bg-emerald-500 text-white shadow-emerald-200', ring: 'ring-2 ring-emerald-300/40' },
}

interface ParentNotification {
  id: number
  title: string
  body: string
  time: string
  read: boolean
  icon: string
}

const PARENT_NOTIFICATIONS: ParentNotification[] = [
  { id: 1, title: 'New lesson summary', body: "Emily's Week 8 Maths summary is ready to review.", time: '5 min ago', read: false, icon: '📚' },
  { id: 2, title: 'At-home activity', body: "Ms Johnson shared a science activity for Sophie to try at home.", time: '1 hr ago', read: false, icon: '🔬' },
  { id: 3, title: 'Teacher message', body: "Ms Johnson sent you a message about James's reading progress.", time: '2 hrs ago', read: false, icon: '💬' },
  { id: 4, title: 'Weekly digest ready', body: "Your child's Week 7 learning digest is available.", time: 'Yesterday', read: true, icon: '📊' },
  { id: 5, title: 'Curriculum update', body: "Week 9 curriculum has been uploaded. Tap to preview topics.", time: '2 days ago', read: true, icon: '📅' },
]


export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)

  // One-time cleanup: remove all seeded mock localStorage data
  useEffect(() => {
    if (typeof window === 'undefined') return
    const CLEAR_FLAG = 'mockDataCleared_v1'
    if (!localStorage.getItem(CLEAR_FLAG)) {
      localStorage.removeItem('learnbridge_day_journal')
      localStorage.removeItem('learnbridge_journal')
      localStorage.removeItem('historicalDataSeeded_v2')
      localStorage.removeItem('historicalDataSeeded_v1')
      localStorage.removeItem('historicalDataSeeded')
      localStorage.setItem(CLEAR_FLAG, '1')
    }
  }, [])

  const [notifications, setNotifications] = useState(PARENT_NOTIFICATIONS)
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)
  const bellRef = useRef<HTMLDivElement>(null)
  const isHome = pathname === '/parent'

  const unreadCount = notifications.filter(n => !n.read).length
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  // Click-outside to close bell dropdown
  useEffect(() => {
    if (!bellOpen) return
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  // Scroll fade for nav pills
  useEffect(() => {
    if (!isHome) return
    const handleScroll = () => {
      const y = window.scrollY
      if (y < 20) {
        setNavVisible(true)
      } else if (y > lastScrollY.current + 8) {
        setNavVisible(false)
      } else if (y < lastScrollY.current - 8) {
        setNavVisible(true)
      }
      lastScrollY.current = y
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  // Active section highlight via IntersectionObserver
  useEffect(() => {
    if (!isHome) return
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '') as SectionId
            setActiveSection(id)
          }
        })
      },
      { threshold: 0.35 },
    )
    navItems.forEach(({ id }) => {
      const el = document.getElementById(`section-${id}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [isHome])

  const handleNavClick = (id: SectionId) => {
    if (pathname === '/parent') {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      router.push(`/parent#section-${id}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-violet-50/30">
      {/* Top bar — Liquid Glass */}
      <div className="px-5 py-3 backdrop-blur-xl bg-white/60 border-b border-white/50 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <span className={`${poppins.className} font-extrabold text-xl bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent tracking-tight`}>
          LearnBridge
        </span>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative" ref={bellRef}>
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
                      onClick={() => {
                        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))
                        setBellOpen(false)
                        const title = n.title.toLowerCase()
                        if (title.includes('summary') || title.includes('digest') || title.includes('activity')) {
                          const isActivity = title.includes('activity')
                          const today = new Date()
                          const yyyy = today.getFullYear()
                          const mm = String(today.getMonth() + 1).padStart(2, '0')
                          const dd = String(today.getDate()).padStart(2, '0')
                          const dateStr = `${yyyy}-${mm}-${dd}`
                          
                          import('@/lib/mockTimetable').then(({ getScheduleForDate, getSchoolDays }) => {
                            let targetDate = dateStr
                            let schedule = getScheduleForDate(targetDate)
                            
                            // If today has no schedule (weekend or outside mock data), use first available date
                            if (schedule.length === 0) {
                              const schoolDays = getSchoolDays()
                              if (schoolDays.length > 0) {
                                targetDate = schoolDays[0]
                                schedule = getScheduleForDate(targetDate)
                              }
                            }
                            
                            if (schedule && schedule.length > 0) {
                              const baseRoute = `/parent/day/${targetDate}/${encodeURIComponent(schedule[0].subject)}`
                              router.push(isActivity ? `${baseRoute}?tab=activity` : baseRoute)
                            } else {
                              if (pathname !== '/parent') router.push('/parent')
                              setTimeout(() => document.getElementById(`section-calendar`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
                            }
                          }).catch(() => {
                            if (pathname !== '/parent') router.push('/parent')
                          })
                        } else if (title.includes('message')) {
                          window.dispatchEvent(new CustomEvent('open-communication-hub', { detail: { tab: 'teacher' } }))
                        }
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
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

      {/* Pill nav — only on /parent home */}
      {isHome && (
        <div
          className={`sticky top-[57px] z-40 transition-all duration-300 ease-in-out ${
            navVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          <nav className="flex items-center justify-center gap-2 px-4 py-2.5">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeSection === id
              const c = sectionColors[id]
              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 backdrop-blur-xl shadow-sm
                    ${isActive
                      ? `${c.active} ${c.ring}`
                      : 'bg-white/70 text-slate-600 border border-white/60 hover:bg-white/90 hover:scale-[1.03]'
                    }`}
                >
                  <Icon size={14} className="shrink-0" />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
      )}

      <div className="flex-1">
        {children}
      </div>

      <CommunicationHub />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
