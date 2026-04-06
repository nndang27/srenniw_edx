import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import ConditionalHeader from '@/components/shared/ConditionalHeader'
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
          <ConditionalHeader />
          <main>{children}</main>
        </ClerkProvider>
      </body>
    </html>
  )
}
