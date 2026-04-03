'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) return
    const role = user.publicMetadata?.role as string
    if (role === 'teacher') router.push('/teacher/dashboard')
    else if (role === 'parent') router.push('/parent/inbox')
  }, [user, isLoaded, router])

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center gap-10 p-8 bg-[#f7f8fc]">
      <div className="text-center max-w-2xl">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#446dd5] bg-[#eef2ff] px-3 py-1 rounded-full mb-4">
          Powered by CurricuLLM
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[#333333] mb-4 leading-tight">
          Connecting Home and School
        </h1>
        <p className="text-[#666666] text-lg max-w-md mx-auto leading-relaxed">
          Bridging communication between teachers and parents through AI — translated into any language, instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-lg">
        <a
          href="/teacher/dashboard"
          className="group flex flex-col gap-3 px-6 py-7 bg-white border border-[#eeeeee] rounded-2xl hover:border-[#446dd5] hover:shadow-lg transition-all duration-200"
        >
          <span className="text-3xl">👩‍🏫</span>
          <div>
            <p className="text-base font-semibold text-[#333333] group-hover:text-[#446dd5] transition-colors">I'm a Teacher</p>
            <p className="text-sm text-[#666666] mt-0.5">Compose messages, track parent responses</p>
          </div>
          <span className="text-xs font-medium text-[#446dd5]">Go to dashboard →</span>
        </a>

        <a
          href="/parent/inbox"
          className="group flex flex-col gap-3 px-6 py-7 bg-white border border-[#eeeeee] rounded-2xl hover:border-[#446dd5] hover:shadow-lg transition-all duration-200"
        >
          <span className="text-3xl">👨‍👩‍👧</span>
          <div>
            <p className="text-base font-semibold text-[#333333] group-hover:text-[#446dd5] transition-colors">I'm a Parent</p>
            <p className="text-sm text-[#666666] mt-0.5">Read updates, chat with your teacher</p>
          </div>
          <span className="text-xs font-medium text-[#446dd5]">Go to inbox →</span>
        </a>
      </div>
    </div>
  )
}
