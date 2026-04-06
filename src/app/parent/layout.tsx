'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useApi } from '@/lib/api'
import { CalendarDays, TrendingUp, Lightbulb } from 'lucide-react'
import type { Language } from '@/types'
import CommunicationHub from '@/components/shared/CommunicationHub'

const navItems = [
  { id: 'calendar',  label: 'Calendar',  icon: CalendarDays },
  { id: 'progress',  label: 'Progress',  icon: TrendingUp },
  { id: 'insights',  label: 'Insights',  icon: Lightbulb },
] as const

type SectionId = typeof navItems[number]['id']

const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'vi', label: 'VI' },
  { value: 'zh', label: '中文' },
  { value: 'ar', label: 'AR' },
]

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const api = useApi()

  const handleLanguageChange = async (lang: Language) => {
    localStorage.setItem('preferred_language', lang)
    await api.updateLanguage(lang).catch(console.error)
  }

  const handleNavClick = (id: SectionId) => {
    if (pathname === '/parent') {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      router.push(`/parent#section-${id}`)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-57px)] bg-[#f8fafc]">
      {/* Top bar */}
      <div className="px-4 py-2 border-b border-[#eeeeee] bg-white flex items-center justify-between sticky top-0 z-50">
        <p className="text-xs font-semibold text-[#999] uppercase tracking-widest">Family Dashboard</p>
        <div className="flex items-center gap-1">
          {languages.map(l => (
            <button
              key={l.value}
              onClick={() => handleLanguageChange(l.value)}
              className="text-xs font-semibold px-2 py-1 rounded-lg text-[#666] hover:text-[#446dd5] hover:bg-[#eef2ff] transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop sidebar + content */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 flex-col bg-white border-r border-[#eeeeee] sticky top-[89px] h-[calc(100vh-89px)]">
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-left"
              >
                <Icon size={18} className="text-slate-400" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 overflow-auto pb-20 md:pb-8">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#eeeeee] bg-white z-30 md:hidden">
        <div className="flex justify-around items-center p-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className="flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors text-slate-500 hover:text-slate-700"
            >
              <div className="p-1 rounded-full">
                <Icon size={22} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Communication Hub FAB */}
      <CommunicationHub />
    </div>
  )
}
