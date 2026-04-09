'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { RefreshCw, Table } from 'lucide-react'
import { cacheGet, cacheSet } from '@/lib/sessionCache'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface WeekInfo {
  week_id: string
  week_num: number
  week_name: string
  topic: string
  assignment_id: string
  max_points: number | null
}

interface GradeCell {
  state: string | null
  assigned_grade: number | null
  draft_grade: number | null
  max_points: number | null
  pct: number | null
}

interface StudentRow {
  id: string
  name: string
  email: string
  avatar: string
  grades: Record<string, GradeCell>
  avg_pct: number | null
  graded_count: number
}

interface TranscriptData {
  weeks: WeekInfo[]
  students: StudentRow[]
}

function gradeColor(pct: number | null): string {
  if (pct === null) return ''
  if (pct >= 85) return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (pct >= 70) return 'bg-blue-50 text-blue-700 border border-blue-200'
  if (pct >= 50) return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-red-50 text-red-600 border border-red-200'
}

function avgLabel(pct: number | null): { text: string; color: string } {
  if (pct === null) return { text: '—', color: 'text-slate-300' }
  if (pct >= 85) return { text: `${pct}%`, color: 'text-emerald-600 font-extrabold' }
  if (pct >= 70) return { text: `${pct}%`, color: 'text-blue-600 font-extrabold' }
  if (pct >= 50) return { text: `${pct}%`, color: 'text-amber-600 font-extrabold' }
  return { text: `${pct}%`, color: 'text-red-600 font-extrabold' }
}

interface Props { classId: string }

export default function TranscriptTab({ classId }: Props) {
  const { getToken } = useAuth()
  const [data, setData] = useState<TranscriptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [visibleWeeks, setVisibleWeeks] = useState(10)

  useEffect(() => {
    const cacheKey = `transcript:${classId}`
    const cached = cacheGet<TranscriptData>(cacheKey)
    if (cached) { setData(cached); setLoading(false); return }

    const load = async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const res = await fetch(`${BASE_URL}/api/teacher/classes/${classId}/transcript`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error()
        const json = await res.json()
        cacheSet(cacheKey, json)
        setData(json)
      } catch { /* silent */ } finally { setLoading(false) }
    }
    load()
  }, [classId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw size={16} className="animate-spin mr-2" /> Loading transcript…
      </div>
    )
  }

  if (!data || data.students.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        No transcript data available. Sync your LMS to get assignment grades.
      </div>
    )
  }

  const displayWeeks = data.weeks.slice(0, visibleWeeks)
  const hasMore = data.weeks.length > visibleWeeks

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Table size={16} className="text-emerald-500" />
            Academic Transcript
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {data.students.length} students · {data.weeks.length} weeks of assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" /> ≥85%
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" /> ≥70%
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block" /> ≥50%
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> &lt;50%
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                {/* Sticky student column */}
                <th className="sticky left-0 z-20 bg-slate-50/90 backdrop-blur-md px-5 py-3.5 text-left min-w-[200px] border-r border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</span>
                </th>
                {displayWeeks.map(w => (
                  <th key={w.week_id} className="px-3 py-3.5 text-center min-w-[72px]">
                    <div className="text-[10px] font-bold text-slate-500">W{w.week_num}</div>
                    <div className="text-[9px] text-slate-300 font-normal mt-0.5 max-w-[64px] mx-auto truncate" title={w.topic}>
                      {w.topic.split(' ').slice(0, 3).join(' ')}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-center min-w-[80px] border-l border-slate-100">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Avg</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {data.students.map(student => {
                const avg = avgLabel(student.avg_pct)
                return (
                  <tr key={student.id} className="hover:bg-white/60 transition-colors">
                    {/* Student name — sticky */}
                    <td className="sticky left-0 z-10 bg-white/80 backdrop-blur-md px-5 py-3 border-r border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-7 h-7 rounded-full bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 truncate leading-tight">{student.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Grade cells */}
                    {displayWeeks.map(w => {
                      const cell = student.grades[w.week_id]
                      const pct = cell?.pct ?? null
                      const grade = cell?.assigned_grade
                      const state = cell?.state

                      return (
                        <td key={w.week_id} className="px-3 py-3 text-center">
                          {grade !== null && grade !== undefined ? (
                            <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-[11px] font-bold ${gradeColor(pct)}`}>
                              {grade}/{w.max_points ?? cell?.max_points}
                            </span>
                          ) : state === 'TURNED_IN' ? (
                            <span className="inline-flex items-center justify-center w-10 h-7 rounded-lg text-[10px] font-semibold bg-violet-50 text-violet-400 border border-violet-100">
                              In
                            </span>
                          ) : state === 'CREATED' || state === 'NEW' ? (
                            <span className="text-slate-200 text-base">·</span>
                          ) : (
                            <span className="text-slate-200 text-base">—</span>
                          )}
                        </td>
                      )
                    })}

                    {/* Average */}
                    <td className="px-4 py-3 text-center border-l border-slate-100">
                      <span className={`text-xs ${avg.color}`}>{avg.text}</span>
                      {student.graded_count > 0 && (
                        <p className="text-[9px] text-slate-300 mt-0.5">{student.graded_count} graded</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Load more weeks */}
        {hasMore && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {visibleWeeks} of {data.weeks.length} weeks
            </span>
            <button
              onClick={() => setVisibleWeeks(v => Math.min(v + 10, data.weeks.length))}
              className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
            >
              Show more weeks →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
