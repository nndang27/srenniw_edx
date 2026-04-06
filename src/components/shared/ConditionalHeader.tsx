'use client'
import { usePathname } from 'next/navigation'
import HeaderAuth from './HeaderAuth'

export default function ConditionalHeader() {
  const pathname = usePathname()
  if (pathname === '/' || pathname.startsWith('/parent') || pathname.startsWith('/teacher')) return null

  return (
    <header className="border-b border-[#eeeeee] px-6 py-3 flex items-center justify-between bg-white sticky top-0 z-50 shadow-sm">
      <a href="/" className="font-semibold text-lg tracking-tight text-[#315bcf]">
        Srenniw
      </a>
      <HeaderAuth />
    </header>
  )
}
