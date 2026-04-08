'use client'
import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, TrendingUp, Users, Brain, BookOpen } from 'lucide-react'
import type { TeacherClass } from '@/lib/mockTeacherData'
import {
  avgCognitiveLevel, studentsNeedingAttention, topPerformers, SUBJECTS,
} from '@/lib/mockTeacherData'

const SUBJECT_COLORS: Record<string, string> = {
  Maths: '#3b82f6',
  Science: '#10b981',
  English: '#8b5cf6',
  HSIE: '#f59e0b',
  'Creative Arts': '#ec4899',
  PE: '#f97316',
}


interface Props {
  cls: TeacherClass
  subject: string
}

export default function OverviewTab({ cls, subject }: Props) {
  const filteredStudents = useMemo(
    () => cls.students,
    [cls.students]
  )

  const avgLevel = avgCognitiveLevel(filteredStudents, subject !== 'All' ? subject : undefined)
  const attention = studentsNeedingAttention(filteredStudents)
  const performers = topPerformers(filteredStudents)

  // Count parents who logged today (students with an entry for today)
  const today = new Date().toISOString().split('T')[0]
  const loggedToday = filteredStudents.filter(s => s.journalEntries.some(e => e.date === today)).length

  // Weekly line chart data — avg cognitive level per day per subject (last 7 days)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const chartData = weekDates.map(date => {
    const point: Record<string, string | number> = {
      date: new Date(date).toLocaleDateString('en-AU', { weekday: 'short' }),
    }
    const displaySubjects = subject !== 'All' ? [subject] : SUBJECTS
    displaySubjects.forEach(subj => {
      const entries = filteredStudents.flatMap(s =>
        s.journalEntries.filter(e => e.date === date && e.subject === subj)
      )
      if (entries.length) {
        point[subj] = +(entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length).toFixed(2)
      }
    })
    return point
  })

  const displaySubjectsForChart = subject !== 'All' ? [subject] : SUBJECTS

  // Subject Performance Table — this week vs last week avg cognitive level
  const thisWeek = weekDates.slice(-7)
  const lastWeekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().split('T')[0]
  })

  const displaySubjects = subject !== 'All' ? [subject] : SUBJECTS
  const subjectPerformance = displaySubjects.map(subj => {
    const thisEntries = filteredStudents.flatMap(s =>
      s.journalEntries.filter(e => thisWeek.includes(e.date) && e.subject === subj)
    )
    const lastEntries = filteredStudents.flatMap(s =>
      s.journalEntries.filter(e => lastWeekDates.includes(e.date) && e.subject === subj)
    )
    const thisAvg = thisEntries.length ? +(thisEntries.reduce((a, e) => a + e.cognitiveLevel, 0) / thisEntries.length).toFixed(1) : null
    const lastAvg = lastEntries.length ? +(lastEntries.reduce((a, e) => a + e.cognitiveLevel, 0) / lastEntries.length).toFixed(1) : null
    const change = thisAvg !== null && lastAvg !== null ? +(thisAvg - lastAvg).toFixed(1) : null
    const status = change === null ? '—' : change > 0.3 ? '↑ Improving' : change < -0.3 ? '↓ Declining' : '→ Stable'
    return { subj, thisAvg, lastAvg, change, status }
  })

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Total Students', value: filteredStudents.length, color: 'text-blue-500' },
          { icon: Brain, label: 'Avg Cognitive', value: `${avgLevel} / 5`, color: 'text-violet-500' },
          { icon: BookOpen, label: 'Logged Today', value: `${loggedToday} / ${filteredStudents.length}`, color: 'text-emerald-500' },
          { icon: AlertTriangle, label: 'Needs Attention', value: attention.length, color: 'text-amber-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-2xl p-4 shadow-sm">
            <Icon size={16} className={`${color} mb-2`} />
            <p className="text-lg font-bold text-slate-800">{value}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Engagement Chart */}
      <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-500" />
          Weekly Engagement — Cognitive Level by Day
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {displaySubjectsForChart.map(subj => (
              <Line
                key={subj}
                type="monotone"
                dataKey={subj}
                stroke={SUBJECT_COLORS[subj]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Subject Performance Table */}
      <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-500" />
          Subject Performance — This Week vs Last Week
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="text-left pb-2 pr-4 font-semibold">Subject</th>
                <th className="text-center pb-2 px-3 font-semibold">This Week</th>
                <th className="text-center pb-2 px-3 font-semibold">Last Week</th>
                <th className="text-center pb-2 px-3 font-semibold">Change</th>
                <th className="text-left pb-2 pl-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subjectPerformance.map(({ subj, thisAvg, lastAvg, change, status }) => (
                <tr key={subj} className="hover:bg-white/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold text-slate-700">{subj}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-slate-800">{thisAvg !== null ? `${thisAvg} / 5` : '—'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-500">
                    {lastAvg !== null ? `${lastAvg} / 5` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {change !== null ? (
                      <span className={`font-semibold ${change > 0.3 ? 'text-emerald-600' : change < -0.3 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {change > 0 ? `+${change}` : change}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 pl-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      status.startsWith('↑') ? 'bg-emerald-50 text-emerald-700' :
                      status.startsWith('↓') ? 'bg-rose-50 text-rose-600' :
                      status === '—' ? 'bg-slate-50 text-slate-400' :
                      'bg-slate-50 text-slate-500'
                    }`}>{status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Students Needing Attention */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Needs Attention ({attention.length})
          </h3>
          {attention.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">All students are on track 🎉</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {attention.map(({ student, reason, suggestion }) => (
                <div key={student.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={student.avatar} alt={student.name} className="w-7 h-7 rounded-full bg-blue-100" />
                    <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                  </div>
                  <p className="text-xs text-amber-700 font-medium">{reason}</p>
                  <p className="text-xs text-slate-500 mt-1">💡 {suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            Top Performers This Week
          </h3>
          {performers.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No improvement data yet</p>
          ) : (
            <div className="space-y-3">
              {performers.map(({ student, subject: subj, change }, i) => (
                <div key={student.id} className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                  <span className="text-lg font-bold text-emerald-400">{['🥇', '🥈', '🥉'][i]}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={student.avatar} alt={student.name} className="w-7 h-7 rounded-full bg-blue-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                    <p className="text-xs text-slate-500">{subj}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+{change} lvls</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
