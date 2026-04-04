'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { LayoutDashboard, PenSquare, MessageCircle } from 'lucide-react'

const navItems = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/compose', label: 'Compose', icon: PenSquare },
  { href: '/teacher/chat', label: 'Messages', icon: MessageCircle },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-slate-200 sticky top-[57px] h-[calc(100vh-57px)]">
        <div className="p-4 flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3">Teacher</p>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        {user && (
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'T'}
              </div>
              <p className="text-sm font-medium text-slate-700 truncate">
                {user.fullName || user.emailAddresses?.[0]?.emailAddress || 'Teacher'}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white z-30">
        <div className="flex justify-around items-center p-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500'}`}
              >
                <Icon size={22} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="flex-1 overflow-auto bg-white pb-20 md:pb-0">{children}</div>
    </div>
  )
}
