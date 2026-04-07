'use client'
import { useEffect } from 'react'
import CalendarPage from './calendar/page'
import ProgressPage from './progress/page'
import TranscriptPage from './transcript/page'
import InsightsPage from './insights/page'

export default function ParentDashboard() {
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  return (
    <div>
      <section id="section-calendar" className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white/60">
        <CalendarPage />
      </section>

      <section id="section-transcript" className="min-h-screen bg-gradient-to-b from-indigo-50/40 to-white/60">
        <div className="px-6 pt-10 pb-2">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Transcript</h2>
          <p className="text-slate-500 mt-1">Academic performance and cognitive levels</p>
        </div>
        <TranscriptPage />
      </section>

      <section id="section-progress" className="min-h-screen bg-gradient-to-b from-violet-50/40 to-white/60">
        <div className="px-6 pt-10 pb-2">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Progress</h2>
          <p className="text-slate-500 mt-1">Track the learning journey over time</p>
        </div>
        <ProgressPage />
      </section>

      <section id="section-insights" className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white/60">
        <div className="px-6 pt-10 pb-2">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Insights</h2>
          <p className="text-slate-500 mt-1">AI-powered learning intelligence</p>
        </div>
        <InsightsPage />
      </section>
    </div>
  )
}
