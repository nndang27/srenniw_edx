'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import {
  SUBJECT_COLORS,
  SUBJECT_BG_COLORS,
  type SubjectName,
} from '@/lib/mockTimetable'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { Poppins } from 'next/font/google'

const poppins = Poppins({ subsets: ['latin'], weight: ['800', '900'] })
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function CalendarPage() {
  const router = useRouter()
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const todayStr = toDateStr(today)

  const [weekStart, setWeekStart] = useState(() => getWeekStart(today))
  const [activeFilter, setActiveFilter] = useState<SubjectName | null>(null)
  
  const [timetable, setTimetable] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<SubjectName[]>([])

  useEffect(() => {
    fetch('/api/timetable')
      .then(r => r.json())
      .then(d => {
        setTimetable(d)
        // Derive unique subjects from timetable
        const allSubjects = Object.values(d as Record<string, any[]>)
          .flat()
          .map((s: any) => s.subject as SubjectName)
        setSubjects([...new Set(allSubjects)])
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    }), [weekStart])

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }
  const goToday  = () => setWeekStart(getWeekStart(today))

  const { entries } = useJournalEntries()
  const loggedDates = useMemo(() => new Set(entries.map(e => e.date)), [entries])

  const weekdayStrs = weekDays.slice(0, 5).map(toDateStr)
  const daysLogged = weekdayStrs.filter(d => loggedDates.has(d)).length

  const weekEntries = entries.filter(e => weekdayStrs.includes(e.date))
  const subjectCounts: Record<string, number> = {}
  for (const e of weekEntries) subjectCounts[e.subject] = (subjectCounts[e.subject] ?? 0) + 1
  const bestSubject = Object.entries(subjectCounts).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null

  const emotionCounts: Record<string, number> = {}
  for (const e of weekEntries) emotionCounts[e.emotion] = (emotionCounts[e.emotion] ?? 0) + 1
  const moodTrend = Object.entries(emotionCounts).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null

  const weekLabel = (() => {
    const start = weekDays[0]
    const end   = weekDays[6]
    const fmt   = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
    return `${fmt(start)} – ${fmt(end)}`
  })()

  const handleFilterClick = (sub: SubjectName) => {
    setActiveFilter(prev => prev === sub ? null : sub)
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-89px)]">
      {/* Hero Header Section */}
      <div className="text-center pt-32 pb-8 px-6 backdrop-blur-xl bg-white/40 border-b border-white/40">
        <div className="relative inline-block">
          <h1 className={`${poppins.className} text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight pb-4 px-4`}>
            LearnBridge
          </h1>
          <span className="hidden md:inline-block absolute left-full top-[10%] ml-4 whitespace-nowrap text-xs font-bold text-slate-400 tracking-[0.3em] uppercase">
            by Srenniw
          </span>
          <span className="block md:hidden text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mt-2">
            by Srenniw
          </span>
        </div>
        <p className="mt-4 text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          The window into your child's daily learning adventure.
        </p>
      </div>

      {/* Main calendar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/40 bg-white/40 backdrop-blur-sm">
          {weekDays.map((day, i) => {
            const dateStr = toDateStr(day)
            const isToday = dateStr === todayStr
            const isWeekend = i >= 5
            return (
              <div key={dateStr} className={`flex flex-col items-center py-2 px-1 ${isWeekend ? 'bg-slate-50/60' : ''}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${isWeekend ? 'text-slate-400' : 'text-slate-500'}`}>
                  {DAY_LABELS[i]}
                </span>
                <div className={`w-7 h-7 flex items-center justify-center rounded-full mt-0.5 text-sm font-bold
                  ${isToday ? 'bg-red-500 text-white' : isWeekend ? 'text-slate-400' : 'text-slate-800'}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Subject blocks grid */}
        <div className="grid grid-cols-7 flex-1 overflow-y-auto divide-x divide-white/30">
          {weekDays.map((day, i) => {
            const dateStr = toDateStr(day)
            const allSchedule = timetable[dateStr] ?? []
            const schedule = activeFilter ? allSchedule.filter((c: any) => c.subject === activeFilter) : allSchedule
            const isWeekend = i >= 5
            const isToday = dateStr === todayStr
            const isPast = day < today

            return (
              <div
                key={dateStr}
                className={`min-h-32 p-1.5 flex flex-col gap-1 transition-colors
                  ${isWeekend ? 'bg-slate-50/60' : 'bg-white/30 hover:bg-slate-50/50'}
                  ${isToday ? 'bg-blue-50/50' : ''}
                  ${isPast && !isToday ? 'opacity-80' : ''}`}
              >
                {schedule.map((cls: any, j: number) => {
                  const color  = SUBJECT_COLORS[cls.subject as SubjectName] ?? '#94a3b8'
                  const bgColor = SUBJECT_BG_COLORS[cls.subject as SubjectName] ?? '#f8fafc'
                  return (
                    <div
                      key={j}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/parent/day/${dateStr}/${encodeURIComponent(cls.subject)}`)
                      }}
                      className="rounded-lg px-1.5 py-1 text-left overflow-hidden cursor-pointer hover:opacity-80 transition-all duration-150 hover:scale-[1.02] backdrop-blur-sm"
                      style={{ background: bgColor, borderLeft: `3px solid ${color}` }}
                    >
                      <p className="text-[10px] font-bold truncate" style={{ color }}>{cls.subject}</p>
                      <p className="text-[9px] text-slate-500 truncate leading-tight">{cls.time}</p>
                      <p className="text-[9px] text-slate-600 truncate leading-tight hidden sm:block">{cls.topic}</p>
                    </div>
                  )
                })}
                {isWeekend && !schedule.length && (
                  <p className="text-[9px] text-slate-400 text-center mt-2">Weekend</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Unified Control Bar: Navigation + Filters */}
        <div className="bg-white/60 backdrop-blur-xl p-3 px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: Week Navigation */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 bg-white/40 border border-white/60 rounded-xl p-0.5">
                <button 
                  onClick={prevWeek} 
                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={nextWeek} 
                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-500"
                  aria-label="Next week"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{weekLabel}</span>
            </div>

            {/* Center: Subject Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1 md:justify-center px-4">
              <button
                onClick={() => setActiveFilter(null)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 text-xs font-semibold shrink-0
                  ${activeFilter === null
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white/40 text-slate-500 border border-white/60 hover:bg-white/80 hover:text-slate-700'}`}
              >
                All
              </button>
              {subjects.map(sub => {
                const isActive = activeFilter === sub
                return (
                  <button
                    key={sub}
                    onClick={() => handleFilterClick(sub)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-200 text-left shrink-0
                      ${isActive ? 'shadow-sm scale-[1.03]' : 'bg-white/40 border border-white/60 hover:bg-white/80'}`}
                    style={isActive ? { background: `${SUBJECT_COLORS[sub]}18`, outline: `1.5px solid ${SUBJECT_COLORS[sub]}40` } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: SUBJECT_COLORS[sub] }}
                    />
                    <span className="text-xs font-semibold text-slate-600">{sub}</span>
                  </button>
                )
              })}
            </div>

            {/* Right: Today Button */}
            <button
              onClick={goToday}
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-full shadow-sm hover:bg-slate-50 transition-all active:scale-95 shrink-0"
            >
              Today
            </button>
          </div>
        </div>

        {/* Weekly summary */}
        <div className="border-t border-white/40 bg-white/50 backdrop-blur-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Weekly Summary</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-2xl p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CalendarDays size={14} className="text-blue-500" />
                <span className="text-lg font-bold text-slate-800">{daysLogged}<span className="text-sm text-slate-400">/5</span></span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Days logged</p>
            </div>
            <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-lg font-bold text-slate-800 mb-1 truncate">
                {bestSubject
                  ? <span style={{ color: SUBJECT_COLORS[bestSubject as SubjectName] ?? '#446dd5' }}>{bestSubject}</span>
                  : <span className="text-slate-300">—</span>}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Best subject</p>
            </div>
            <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-lg font-bold text-slate-800 mb-1 truncate">
                {moodTrend ?? <span className="text-slate-300">—</span>}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Mood trend</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
