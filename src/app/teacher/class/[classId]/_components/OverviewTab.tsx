'use client'
import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, TrendingUp, Users, Brain, Smile, BookOpen } from 'lucide-react'
import type { TeacherClass } from '@/lib/mockTeacherData'
import {
  avgCognitiveLevel, dominantEmotion, studentsNeedingAttention, topPerformers, SUBJECTS,
} from '@/lib/mockTeacherData'

const SUBJECT_COLORS: Record<string, string> = {
  Maths: '#3b82f6',
  Science: '#10b981',
  English: '#8b5cf6',
  HSIE: '#f59e0b',
  'Creative Arts': '#ec4899',
  PE: '#f97316',
}

const EMOTION_CELL_BG: Record<string, string> = {
  Happy: 'bg-emerald-400',
  Curious: 'bg-blue-400',
  Excited: 'bg-yellow-400',
  Anxious: 'bg-rose-400',
  Disengaged: 'bg-gray-300',
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
  const { emotion: mood, emoji: moodEmoji } = dominantEmotion(filteredStudents)
  const attention = studentsNeedingAttention(filteredStudents)
  const performers = topPerformers(filteredStudents)

  // Count parents who logged today (students with an entry for today)
  const today = '2026-04-06'
  const loggedToday = filteredStudents.filter(s => s.journalEntries.some(e => e.date === today)).length

  // Weekly line chart data — avg cognitive level per day per subject (last 7 days)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date('2026-04-06')
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

  // Emotion heatmap summary
  const allEntries = filteredStudents.flatMap(s =>
    s.journalEntries.filter(e => weekDates.includes(e.date))
  )
  const emotionCounts = Object.keys(EMOTION_CELL_BG).map(em => ({
    emotion: em,
    count: allEntries.filter(e => e.emotion === em).length,
  })).sort((a, b) => b.count - a.count)
  const topEmotion = emotionCounts[0]
  const topPct = allEntries.length ? Math.round((topEmotion?.count ?? 0) / allEntries.length * 100) : 0

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Total Students', value: filteredStudents.length, color: 'text-blue-500' },
          { icon: Brain, label: 'Avg Cognitive', value: `${avgLevel} / 5`, color: 'text-violet-500' },
          { icon: BookOpen, label: 'Logged Today', value: `${loggedToday} / ${filteredStudents.length}`, color: 'text-emerald-500' },
          { icon: Smile, label: 'Class Mood', value: `${moodEmoji} ${mood}`, color: 'text-amber-500' },
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

      {/* Emotion Heatmap */}
      <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-1">Emotion Heatmap — Last 7 Days</h3>
        <p className="text-xs text-slate-400 mb-4">Hover a cell to see details</p>

        {/* Header row */}
        <div className="flex items-center gap-1 mb-1">
          <div className="w-32 shrink-0" />
          {weekDates.map(d => (
            <div key={d} className="flex-1 text-center text-[10px] text-slate-400 font-bold">
              {new Date(d).toLocaleDateString('en-AU', { weekday: 'narrow' })}
            </div>
          ))}
        </div>

        {/* Student rows */}
        <div className="space-y-0.5">
          {filteredStudents.slice(0, 20).map(student => (
            <div key={student.id} className="flex items-center gap-1">
              <span className="text-xs text-slate-500 w-32 shrink-0 truncate pr-2">{student.name}</span>
              {weekDates.map(date => {
                const entry = student.journalEntries.find(e => e.date === date)
                return (
                  <div
                    key={date}
                    title={entry ? `${student.name} — ${entry.emotion} · ${date}` : `${student.name} — No entry`}
                    className={`flex-1 h-6 rounded-lg cursor-default transition-opacity hover:opacity-75
                      ${entry ? EMOTION_CELL_BG[entry.emotion] : 'bg-gray-100'}`}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend + summary */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100">
          {Object.entries(EMOTION_CELL_BG).map(([emotion, bg]) => (
            <span key={emotion} className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className={`w-3.5 h-3.5 rounded ${bg} inline-block`} />
              {emotion}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-slate-400 font-semibold">
            Most common: {topEmotion?.emotion ?? '—'} ({topPct}%)
          </span>
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
