'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PenSquare, MessageCircle } from 'lucide-react'

const navItems = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/compose', label: 'Compose', icon: PenSquare },
  { href: '/teacher/chat', label: 'Chat', icon: MessageCircle },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <aside className="w-56 border-r border-[#eeeeee] bg-[#f7f8fc] flex flex-col py-6 px-3 shrink-0">
        <p className="text-xs font-semibold text-[#999] uppercase tracking-widest px-3 mb-3">Teacher</p>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-[#eef2ff] text-[#446dd5]'
                  : 'text-[#666666] hover:bg-white hover:text-[#333333]'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-auto bg-white">{children}</div>
    </div>
  )
}
