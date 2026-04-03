import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import HeaderAuth from '@/components/shared/HeaderAuth'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Srenniw — Connecting Home and School',
  description: 'AI-powered communication between teachers and parents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.className}>
      <body>
        <ClerkProvider>
          <header className="border-b border-[#eeeeee] px-6 py-3 flex items-center justify-between bg-white sticky top-0 z-50 shadow-sm">
            <a href="/" className="font-semibold text-lg tracking-tight text-[#315bcf]">
              Srenniw
            </a>
            <HeaderAuth />
          </header>
          <main>{children}</main>
        </ClerkProvider>
      </body>
    </html>
  )
}
