'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { GraduationCap, Home } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) return
    const role = user.publicMetadata?.role as string
    if (role === 'teacher') router.push('/teacher/dashboard')
    else if (role === 'parent') router.push('/parent/digest')
  }, [user, isLoaded, router])

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="max-w-4xl w-full text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
            Powered by CurricuLLM
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Where education meets <span className="text-emerald-500">real life</span>.
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Bridging communication between teachers and parents through AI — translated into any language, instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Teacher Portal */}
          <Card
            className="group relative overflow-hidden border-2 border-transparent hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
            onClick={() => router.push('/teacher/dashboard')}
            data-testid="card-teacher-portal"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <GraduationCap size={120} />
            </div>
            <CardHeader className="pb-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center mb-6">
                <GraduationCap size={32} />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">Teacher Portal</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-col">
              <CardDescription className="text-lg text-slate-600 mb-8">
                Share this week&apos;s curriculum in minutes. Our AI simplifies it for families automatically.
              </CardDescription>
              <Button
                size="lg"
                className="w-full text-lg h-14 rounded-xl"
                onClick={e => { e.stopPropagation(); router.push('/teacher/dashboard') }}
                data-testid="button-enter-teacher"
              >
                Enter Portal
              </Button>
            </CardContent>
          </Card>

          {/* Family Dashboard */}
          <Card
            className="group relative overflow-hidden border-2 border-transparent hover:border-emerald-200 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer"
            onClick={() => router.push('/parent/digest')}
            data-testid="card-family-dashboard"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Home size={120} />
            </div>
            <CardHeader className="pb-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-500 flex items-center justify-center mb-6">
                <Home size={32} />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">Family Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-col">
              <CardDescription className="text-lg text-slate-600 mb-8">
                Stay connected to your child&apos;s learning with personalised activities and daily insights.
              </CardDescription>
              <Button
                size="lg"
                className="w-full text-lg h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600"
                onClick={e => { e.stopPropagation(); router.push('/parent/digest') }}
                data-testid="button-enter-parent"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
