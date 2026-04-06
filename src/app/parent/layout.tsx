'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, TrendingUp, Lightbulb, Settings } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { Poppins } from 'next/font/google'
import CommunicationHub from '@/components/shared/CommunicationHub'
import SettingsModal from '@/components/shared/SettingsModal'

const poppins = Poppins({ subsets: ['latin'], weight: ['800'] })

const navItems = [
  { id: 'calendar',  label: 'Calendar',  icon: CalendarDays },
  { id: 'progress',  label: 'Progress',  icon: TrendingUp },
  { id: 'insights',  label: 'Insights',  icon: Lightbulb },
] as const

type SectionId = typeof navItems[number]['id']

const sectionColors: Record<SectionId, { active: string; ring: string }> = {
  calendar: { active: 'bg-blue-500 text-white shadow-blue-200', ring: 'ring-2 ring-blue-300/40' },
  progress:  { active: 'bg-violet-500 text-white shadow-violet-200', ring: 'ring-2 ring-violet-300/40' },
  insights:  { active: 'bg-emerald-500 text-white shadow-emerald-200', ring: 'ring-2 ring-emerald-300/40' },
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)
  const isHome = pathname === '/parent'

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
