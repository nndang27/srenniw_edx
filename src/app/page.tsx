'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Poppins } from 'next/font/google'

const poppins = Poppins({ subsets: ['latin'], weight: ['800'] })

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded || !user) return
    const role = user.publicMetadata?.role as string
    if (role === 'teacher') router.push('/teacher')
    else if (role === 'parent') router.push('/parent')
  }, [user, isLoaded, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-violet-50/30 flex flex-col items-center justify-center px-4 py-12">
      {/* Branding */}
      <div className="mb-10 text-center">
        <span className={`${poppins.className} text-3xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent tracking-tight`}>
          LearnBridge
        </span>
        <p className="text-slate-500 text-sm mt-2">Connecting home and school through AI</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {/* Teacher */}
        <button
          onClick={() => router.push('/teacher')}
          className="group backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-200">
            👨‍🏫
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">I&apos;m a Teacher</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Manage your class, share curriculum, and communicate with parents — all in one place.
          </p>
          <div className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-xs font-semibold rounded-full group-hover:bg-blue-600 transition-colors">
            Enter Teacher Portal →
          </div>
        </button>

        {/* Parent */}
        <button
          onClick={() => router.push('/parent')}
          className="group backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-200">
            👨‍👩‍👧
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">I&apos;m a Parent</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Stay connected to your child&apos;s learning with daily insights, activities, and direct teacher chat.
          </p>
          <div className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-full group-hover:bg-emerald-600 transition-colors">
            Go to Family Dashboard →
          </div>
        </button>
      </div>

      <p className="mt-10 text-[11px] text-slate-400 text-center">
        Powered by CurricuLLM · Built for EDX Hackathon 2026
      </p>
    </div>
  )
}
