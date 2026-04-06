'use client'
import { useState, useMemo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer,
} from 'recharts'
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { TeacherClass, Student } from '@/lib/mockTeacherData'
import { SUBJECTS } from '@/lib/mockTeacherData'

const SUBJECT_COLORS: Record<string, string> = {
  Maths: '#3b82f6',
  Science: '#10b981',
  English: '#8b5cf6',
  HSIE: '#f59e0b',
  'Creative Arts': '#ec4899',
  PE: '#f97316',
}

const EMOTION_COLORS: Record<string, string> = {
  Curious: '#3b82f6',
  Excited: '#f59e0b',
  Happy: '#10b981',
  Anxious: '#ef4444',
  Disengaged: '#94a3b8',
}

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate']

interface Props {
  cls: TeacherClass
  subject: string
}

function ClassView({ cls, subject }: Props) {
  const displaySubjects = subject !== 'All' ? [subject] : SUBJECTS

  // Radar data — avg cognitive per subject
  const radarData = displaySubjects.map(subj => {
    const entries = cls.students.flatMap(s => s.journalEntries.filter(e => e.subject === subj))
    const avg = entries.length ? entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length : 0
    return { subject: subj, value: parseFloat(avg.toFixed(2)), fullMark: 5 }
  })

  // Stacked bar — cognitive distribution per subject
  const barData = displaySubjects.map(subj => {
    const entries = cls.students.flatMap(s => s.journalEntries.filter(e => e.subject === subj))
    const counts = [1, 2, 3, 4, 5].map(lvl => entries.filter(e => e.cognitiveLevel === lvl).length)
    return {
      subject: subj.slice(0, 4),
      Emerging: counts[0],
      Developing: counts[1],
      Applying: counts[2],
      Extending: counts[3],
      Mastering: counts[4],
    }
  })

  // Class avg table — Subject | Avg Level | Trend | Top Student | Needs Support
  const today = new Date('2026-04-06')
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0]
  })
  const prev7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - 7 - i); return d.toISOString().split('T')[0]
  })

  const classAvgTable = SUBJECTS.map(subj => {
    const entries = cls.students.flatMap(s => s.journalEntries.filter(e => e.subject === subj))
    const avg = entries.length ? entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length : 0

    const recentEntries = cls.students.flatMap(s => s.journalEntries.filter(e => e.subject === subj && last7.includes(e.date)))
    const olderEntries = cls.students.flatMap(s => s.journalEntries.filter(e => e.subject === subj && prev7.includes(e.date)))
    const recentAvg = recentEntries.length ? recentEntries.reduce((a, e) => a + e.cognitiveLevel, 0) / recentEntries.length : avg
    const olderAvg = olderEntries.length ? olderEntries.reduce((a, e) => a + e.cognitiveLevel, 0) / olderEntries.length : avg
    const trend = recentAvg > olderAvg + 0.2 ? 'up' : recentAvg < olderAvg - 0.2 ? 'down' : 'flat'

    const studentAvgs = cls.students.map(s => {
      const e = s.journalEntries.filter(e => e.subject === subj)
      return { name: s.name.split(' ')[0], avg: e.length ? e.reduce((a, b) => a + b.cognitiveLevel, 0) / e.length : 0 }
    }).filter(s => s.avg > 0).sort((a, b) => b.avg - a.avg)

    return {
      subj,
      avg: parseFloat(avg.toFixed(1)),
      trend,
      topStudent: studentAvgs[0]?.name ?? '—',
      needsSupport: studentAvgs[studentAvgs.length - 1]?.name ?? '—',
    }
  })

  // Student × Subject heatmap
  const heatmapData = cls.students.map(s => {
    const row: Record<string, number> = {}
    SUBJECTS.forEach(subj => {
      const e = s.journalEntries.filter(e => e.subject === subj)
      row[subj] = e.length ? parseFloat((e.reduce((a, b) => a + b.cognitiveLevel, 0) / e.length).toFixed(1)) : 0
    })
    return { name: s.name.split(' ')[0], ...row }
  })

  const heatColor = (v: number) => {
    if (!v) return 'bg-slate-100 text-slate-300'
    if (v < 2) return 'bg-red-200 text-red-700'
    if (v < 3) return 'bg-amber-200 text-amber-700'
    if (v < 4) return 'bg-yellow-200 text-yellow-700'
    if (v < 4.5) return 'bg-blue-200 text-blue-700'
    return 'bg-emerald-200 text-emerald-700'
  }

  // Auto-generated strengths/areas
  const subjectAvgs = SUBJECTS.map(subj => {
    const entries = cls.students.flatMap(s => s.journalEntries.filter(e => e.subject === subj))
    const avg = entries.length ? entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length : 0
    return { subj, avg }
  }).sort((a, b) => b.avg - a.avg)

  const strengths = subjectAvgs.slice(0, 2)
  const growth = subjectAvgs.slice(-2)

  return (
    <div className="space-y-5">
      {/* Radar + Bar side by side */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">Subject Performance Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Radar name="Avg Level" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm overflow-x-auto">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">Cognitive Level Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
              <Bar dataKey="Emerging" stackId="a" fill="#ef4444" radius={[0,0,0,0]} />
              <Bar dataKey="Developing" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Applying" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Extending" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="Mastering" stackId="a" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Academic Performance Table */}
      <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm overflow-x-auto">
        <h3 className="font-bold text-slate-800 mb-4 text-sm">Class Academic Performance by Subject</h3>
        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-100">
              {['Subject', 'Avg Level', 'Trend', 'Top Student', 'Needs Support'].map(h => (
                <th key={h} className="text-left pb-2 pr-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classAvgTable.map(({ subj, avg, trend, topStudent, needsSupport }) => (
              <tr key={subj} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="py-2.5 pr-4">
                  <span className="font-semibold text-slate-700">{subj}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(avg / 5) * 100}%`, backgroundColor: SUBJECT_COLORS[subj] }} />
                    </div>
                    <span className="font-bold text-slate-700">{avg}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  {trend === 'up' ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold"><TrendingUp size={11} /> Up</span>
                  ) : trend === 'down' ? (
                    <span className="flex items-center gap-1 text-red-500 font-semibold"><TrendingDown size={11} /> Down</span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400 font-semibold"><Minus size={11} /> Stable</span>
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{topStudent}</span>
                </td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{needsSupport}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Performance Heatmap */}
      <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm overflow-x-auto">
        <h3 className="font-bold text-slate-800 mb-1 text-sm">Student × Subject Heatmap</h3>
        <p className="text-[10px] text-slate-400 mb-4">Average cognitive level per student per subject</p>
        <div className="min-w-[480px]">
          {/* Header row */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `80px repeat(${SUBJECTS.length}, 1fr)` }}>
            <div />
            {SUBJECTS.map(s => (
              <div key={s} className="text-[9px] font-bold text-slate-400 text-center truncate px-1">{s.slice(0, 5)}</div>
            ))}
          </div>
          {/* Data rows */}
          <div className="space-y-0.5">
            {heatmapData.map(row => (
              <div key={row.name} className="grid gap-1 items-center" style={{ gridTemplateColumns: `80px repeat(${SUBJECTS.length}, 1fr)` }}>
                <span className="text-[10px] text-slate-600 font-medium truncate">{row.name}</span>
                {SUBJECTS.map(subj => {
                  const v = (row as unknown as Record<string, number>)[subj] ?? 0
                  return (
                    <div key={subj} className={`h-6 rounded flex items-center justify-center text-[10px] font-bold ${heatColor(v)}`}>
                      {v > 0 ? v.toFixed(1) : '—'}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { label: '< 2.0', cls: 'bg-red-200 text-red-700' },
              { label: '2.0–3.0', cls: 'bg-amber-200 text-amber-700' },
              { label: '3.0–4.0', cls: 'bg-yellow-200 text-yellow-700' },
              { label: '4.0–4.5', cls: 'bg-blue-200 text-blue-700' },
              { label: '4.5–5.0', cls: 'bg-emerald-200 text-emerald-700' },
            ].map(({ label, cls }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-4 h-3 rounded text-[8px] flex items-center justify-center ${cls}`} />
                <span className="text-[9px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & growth */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-500" /> Class Strengths
          </h3>
          {strengths.map(({ subj, avg }) => (
            <div key={subj} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-700">{subj}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-emerald-600">{avg.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
            <TrendingDown size={15} className="text-amber-500" /> Areas for Growth
          </h3>
          {growth.map(({ subj, avg }) => (
            <div key={subj} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-700">{subj}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-amber-600">{avg.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function IndividualView({ cls, subject }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>(cls.students[0]?.id ?? '')

  const filtered = useMemo(
    () => cls.students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [cls.students, search]
  )

  const student = cls.students.find(s => s.id === selectedId) ?? cls.students[0]

  // Per-subject cognitive avg for selected student
  const subjectAvgs = SUBJECTS.map(subj => {
    const entries = student.journalEntries.filter(e => e.subject === subj)
    const avg = entries.length ? entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length : 0
    return { subj, avg: parseFloat(avg.toFixed(2)) }
  })

  // Last emotion (most recent journal entry)
  const lastEmotion = student.journalEntries[0]?.emotion ?? 'Happy'
  const emotionEmoji: Record<string, string> = {
    Curious: '🤔', Excited: '🎉', Happy: '😊', Anxious: '😰', Disengaged: '😔',
  }

  // Cognitive level line chart over last 7 days
  const today = new Date('2026-04-06')
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const displaySubjects = subject !== 'All' ? [subject] : SUBJECTS
  const cogLineData = dates.map(date => {
    const point: Record<string, string | number> = {
      date: new Date(date).toLocaleDateString('en-AU', { weekday: 'short' }),
    }
    displaySubjects.forEach(subj => {
      const entry = student.journalEntries.find(e => e.date === date && e.subject === subj)
      if (entry) point[subj] = entry.cognitiveLevel
    })
    return point
  })

  // Bloom's bars (map cognitiveLevel 1-5 → Bloom)
  const bloomData = BLOOM_LEVELS.map((level, i) => {
    const count = student.journalEntries.filter(e => e.cognitiveLevel === i + 1).length
    return { level, count }
  })

  // Emotion history dots
  const recentEntries = student.journalEntries.slice(0, 7)

  // Trend indicator
  const recent = student.journalEntries.slice(0, 3).map(e => e.cognitiveLevel)
  const older = student.journalEntries.slice(3, 6).map(e => e.cognitiveLevel)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / (recent.length || 1)
  const olderAvg = older.reduce((a, b) => a + b, 0) / (older.length || 1)
  const trend = recentAvg > olderAvg + 0.3 ? 'up' : recentAvg < olderAvg - 0.3 ? 'down' : 'flat'

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Student list sidebar */}
      <div className="w-52 shrink-0 flex flex-col gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white/70 backdrop-blur-xl outline-none focus:border-blue-300"
          />
        </div>
        <div className="space-y-1 overflow-y-auto flex-1 max-h-[560px] [&::-webkit-scrollbar]:hidden">
          {filtered.map(s => {
            const last = s.journalEntries[0]?.emotion ?? 'Happy'
            const isSelected = s.id === selectedId
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all
                  ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/60 hover:bg-white/80 text-slate-700'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full shrink-0" />
                <span className="text-xs font-medium truncate flex-1">{s.name}</span>
                <span className="text-sm">{emotionEmoji[last]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Student detail panel */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full ring-2 ring-blue-200" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800">{student.name}</p>
            <p className="text-xs text-slate-400">
              {lastEmotion} {emotionEmoji[lastEmotion]} &nbsp;·&nbsp; {student.journalEntries.length} entries
            </p>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
            ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </div>
        </div>

        {/* Cognitive chart */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm">
          <p className="font-bold text-slate-800 text-sm mb-3">Cognitive Level — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={cogLineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
              {displaySubjects.map(subj => (
                <Line key={subj} type="monotone" dataKey={subj} stroke={SUBJECT_COLORS[subj]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Bloom's bars */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm">
            <p className="font-bold text-slate-800 text-sm mb-3">Bloom&apos;s Taxonomy Distribution</p>
            <div className="space-y-2">
              {bloomData.map(({ level, count }) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-16 shrink-0">{level}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, count * 8)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-4">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion dots + subject avgs */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm space-y-3">
            <div>
              <p className="font-bold text-slate-800 text-sm mb-2">Recent Emotion History</p>
              <div className="flex gap-1.5">
                {recentEntries.map((e, i) => (
                  <div
                    key={i}
                    title={`${e.emotion} — ${e.date}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: EMOTION_COLORS[e.emotion] + '33' }}
                  >
                    {emotionEmoji[e.emotion]}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm mb-2">Subject Averages</p>
              <div className="space-y-1">
                {subjectAvgs.map(({ subj, avg }) => (
                  <div key={subj} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-20 shrink-0 truncate">{subj}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(avg / 5) * 100}%`, backgroundColor: SUBJECT_COLORS[subj] }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">{avg.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent journal notes */}
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm">
          <p className="font-bold text-slate-800 text-sm mb-3">Recent Journal Notes</p>
          <div className="space-y-2 max-h-36 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {student.journalEntries.slice(0, 5).map((e, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="text-slate-400 shrink-0 w-16">{e.date.slice(5)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[e.subject] + '22', color: SUBJECT_COLORS[e.subject] }}>{e.subject}</span>
                <span className="text-slate-600 leading-snug">{e.notes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI summary card */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-violet-50/80 border border-blue-100 rounded-3xl p-4 shadow-sm">
          <p className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
            <span className="text-base">✨</span> AI Summary
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {student.name.split(' ')[0]} shows a <strong>{trend === 'up' ? 'positive upward' : trend === 'down' ? 'concerning downward' : 'steady'}</strong> trend in cognitive engagement.
            Strongest in <strong>{subjectAvgs[0]?.subj}</strong> (avg {subjectAvgs[0]?.avg.toFixed(1)}/5).
            Most recent emotion: <strong>{lastEmotion}</strong> {emotionEmoji[lastEmotion]}.
            {trend === 'down' ? ' Consider a check-in conversation or differentiated support.' : ' Continue current approach — student is responding well.'}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">ZPD Indicator: Level {Math.min(5, Math.round(subjectAvgs[0]?.avg ?? 3))}–{Math.min(5, Math.round((subjectAvgs[0]?.avg ?? 3) + 1))} recommended</p>
        </div>
      </div>
    </div>
  )
}

export default function InsightsTab({ cls, subject }: Props) {
  const [view, setView] = useState<'class' | 'individual'>('class')

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('class')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            ${view === 'class' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
        >
          📊 Class View
        </button>
        <button
          onClick={() => setView('individual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            ${view === 'individual' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
        >
          👤 Individual View
        </button>
      </div>

      {view === 'class' ? (
        <ClassView cls={cls} subject={subject} />
      ) : (
        <IndividualView cls={cls} subject={subject} />
      )}
    </div>
  )
}
