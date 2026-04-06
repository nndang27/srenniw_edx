'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, TrendingUp, Brain } from 'lucide-react'

const journalTabs = [
  { href: '/parent/journal', label: 'Journal', icon: BookOpen },
  { href: '/parent/journal/progress', label: 'Progress', icon: TrendingUp },
  { href: '/parent/journal/dashboard', label: 'Insights', icon: Brain },
]

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="w-full">
      {/* Sub-navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#eeeeee] px-4">
        <div className="max-w-2xl mx-auto flex gap-0 justify-center">
          {journalTabs.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      {children}
    </div>
  )
}
