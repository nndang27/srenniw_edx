'use client'
import { useEffect } from 'react'
import CalendarPage from './calendar/page'
import ProgressPage from './progress/page'
import DashboardPage from './journal/dashboard/page'

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
      <section id="section-calendar" className="h-[calc(100vh-89px)] overflow-hidden">
        <CalendarPage />
      </section>

      <section id="section-progress" className="min-h-[calc(100vh-89px)] border-t border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200 bg-white">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress</h2>
        </div>
        <ProgressPage />
      </section>

      <section id="section-insights" className="min-h-[calc(100vh-89px)] border-t border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200 bg-white">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Insights</h2>
        </div>
        <DashboardPage />
      </section>
    </div>
  )
}
