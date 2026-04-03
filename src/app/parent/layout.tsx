'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApi } from '@/lib/api'
import { Bell, MessageCircle, Bot } from 'lucide-react'
import type { Language } from '@/types'

const navItems = [
  { href: '/parent/inbox', label: 'Inbox', icon: Bell },
  { href: '/parent/chat', label: 'Chat', icon: MessageCircle },
  { href: '/parent/chatbot', label: 'Ask AI', icon: Bot },
]

const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'zh', label: '中文' },
  { value: 'ar', label: 'عربي' },
]

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const api = useApi()

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await api.updateLanguage(e.target.value)
    window.location.reload()
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-57px)] bg-[#f7f8fc]">
      {/* Language selector bar */}
      <div className="px-4 py-2 border-b border-[#eeeeee] bg-white flex items-center justify-between">
        <p className="text-xs font-semibold text-[#999] uppercase tracking-widest">Parent Portal</p>
        <select
          onChange={handleLanguageChange}
          className="text-sm border border-[#eeeeee] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#446dd5] text-[#333] bg-white"
        >
          {languages.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-auto pb-20">
        {children}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#eeeeee] bg-white z-50">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
                pathname === href
                  ? 'text-[#446dd5]'
                  : 'text-[#999] hover:text-[#333]'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
