'use client'
import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, Cell,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, Clock, Brain, Zap, BarChart2 } from 'lucide-react'
import { getAllSubjectEntries, type SubjectEntry } from '@/lib/journal'
import { SUBJECT_COLORS, type SubjectName } from '@/lib/mockTimetable'

const SUBJECTS: SubjectName[] = ['Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE']
const EMOTIONS = ['Curious', 'Excited', 'Happy', 'Anxious', 'Disengaged']

const EMOTION_COLORS: Record<string, string> = {
  Curious: '#3b82f6',
  Excited: '#f97316',
  Happy: '#10b981',
  Anxious: '#8b5cf6',
  Disengaged: '#94a3b8',
}

type TimeRange = 'week' | 'month' | 'term'

function getDateRange(range: TimeRange): string {
  const now = new Date()
  if (range === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  }
  if (range === 'month') {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }
  // term = ~10 weeks
  const d = new Date(now)
  d.setDate(d.getDate() - 70)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <BarChart2 size={28} className="text-slate-400" />
      </div>
      <p className="text-slate-700 font-semibold text-base mb-1">No data yet</p>
      <p className="text-slate-400 text-sm max-w-[240px]">
        Start logging journal entries from the Calendar to see progress charts here.
      </p>
    </div>
  )
}

// ── Cognitive Level Line Chart ──────────────────────────────────────────────

function CognitiveLevelChart({ data }: { data: { date: string; level: number }[] }) {
  return (
    <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={16} className="text-[#446dd5]" />
          <p className="text-sm font-semibold text-slate-700">Cognitive Level</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`Level ${v}`, 'Cognitive']}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Line
              type="monotone"
              dataKey="level"
              stroke="#446dd5"
              strokeWidth={2}
              dot={{ r: 4, fill: '#446dd5', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
    </div>
  )
}

// ── Emotion Bar Chart ───────────────────────────────────────────────────────

function EmotionChart({ data }: { data: { emotion: string; count: number }[] }) {
  return (
    <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-amber-500" />
          <p className="text-sm font-semibold text-slate-700">Emotion Frequency</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="emotion"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [v, 'Sessions']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.emotion} fill={EMOTION_COLORS[entry.emotion] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
    </div>
  )
}

// ── Radar "Compare All" Chart ───────────────────────────────────────────────

function CompareRadarChart({ entries }: { entries: SubjectEntry[] }) {
  const radarData = SUBJECTS.map(sub => {
    const subEntries = entries.filter(e => e.subject === sub)
    const avg = subEntries.length
      ? subEntries.reduce((s, e) => s + e.cognitiveLevel, 0) / subEntries.length
      : 0
    return { subject: sub, avgLevel: parseFloat(avg.toFixed(1)) }
  })

  return (
    <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-emerald-500" />
          <p className="text-sm font-semibold text-slate-700">All Subjects — Avg Cognitive Level</p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <Radar
              dataKey="avgLevel"
              stroke="#446dd5"
              fill="#446dd5"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(v) => [`${v} / 5`, 'Avg Level']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
          </RadarChart>
        </ResponsiveContainer>
    </div>
  )
}

// ── Subject Stats Card ──────────────────────────────────────────────────────

function SubjectStatsCard({
  subject,
  entries,
}: {
  subject: SubjectName
  entries: SubjectEntry[]
}) {
  const color = SUBJECT_COLORS[subject] ?? '#446dd5'
  const subEntries = entries.filter(e => e.subject === subject)

  if (subEntries.length === 0) return null

  const avgLevel = subEntries.reduce((s, e) => s + e.cognitiveLevel, 0) / subEntries.length
  const bestLevel = Math.max(...subEntries.map(e => e.cognitiveLevel))
  const totalTime = subEntries.reduce((s, e) => s + e.timeSpent, 0)
  const avgTime = totalTime / subEntries.length

  // Trend: compare last 3 vs first 3
  const sorted = [...subEntries].sort((a, b) => a.date.localeCompare(b.date))
  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (sorted.length >= 4) {
    const first = sorted.slice(0, Math.floor(sorted.length / 2))
    const last  = sorted.slice(Math.ceil(sorted.length / 2))
    const firstAvg = first.reduce((s, e) => s + e.cognitiveLevel, 0) / first.length
    const lastAvg  = last.reduce((s, e) => s + e.cognitiveLevel, 0) / last.length
    trend = lastAvg > firstAvg + 0.3 ? 'up' : lastAvg < firstAvg - 0.3 ? 'down' : 'flat'
  }

  // Consistency: % of max possible sessions (rough: 1 per school day)
  const uniqueDays = new Set(subEntries.map(e => e.date)).size

  return (
    <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-3 rounded-full" style={{ background: color }} />
          <p className="text-sm font-semibold text-slate-700">{subject} — Summary</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-white/50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold" style={{ color }}>{avgLevel.toFixed(1)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Avg Level</p>
          </div>
          <div className="bg-white/50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800">{bestLevel}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Best Level</p>
          </div>
          <div className="bg-white/50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800">{Math.round(avgTime)}m</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Avg / session</p>
          </div>
          <div className="bg-white/50 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{uniqueDays} days logged</p>
          </div>
        </div>
    </div>
  )
}

// ── Time Spent Stats ────────────────────────────────────────────────────────

function TimeSpentCard({ entries }: { entries: SubjectEntry[] }) {
  const totalMins = entries.reduce((s, e) => s + e.timeSpent, 0)
  const avgMins   = entries.length ? Math.round(totalMins / entries.length) : 0
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  return (
    <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-orange-500" />
          <p className="text-sm font-semibold text-slate-700">Time Spent</p>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 bg-orange-50/60 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-orange-600">
              {hrs > 0 ? `${hrs}h ${mins}m` : `${totalMins}m`}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Total time</p>
          </div>
          <div className="flex-1 bg-white/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-slate-700">{avgMins}m</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Avg / session</p>
          </div>
        </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [selectedSubject, setSelectedSubject] = useState<'All' | SubjectName>('All')
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [showRadar, setShowRadar] = useState(false)

  const allEntries = useMemo(() => getAllSubjectEntries(), [])

  const cutoff = useMemo(() => getDateRange(timeRange), [timeRange])

  const filteredByRange = useMemo(
    () => allEntries.filter(e => e.date >= cutoff),
    [allEntries, cutoff]
  )

  const filteredEntries = useMemo(
    () =>
      selectedSubject === 'All'
        ? filteredByRange
        : filteredByRange.filter(e => e.subject === selectedSubject),
    [filteredByRange, selectedSubject]
  )

  // Cognitive level line chart data (one point per day per subject)
  const cognitiveData = useMemo(() => {
    const byDate: Record<string, number[]> = {}
    filteredEntries.forEach(e => {
      byDate[e.date] = byDate[e.date] ?? []
      byDate[e.date].push(e.cognitiveLevel)
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, levels]) => ({
        date,
        level: parseFloat((levels.reduce((s, l) => s + l, 0) / levels.length).toFixed(1)),
      }))
  }, [filteredEntries])

  // Emotion frequency bar chart data
  const emotionData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredEntries.forEach(e => {
      counts[e.emotion] = (counts[e.emotion] ?? 0) + 1
    })
    return EMOTIONS.map(em => ({ emotion: em, count: counts[em] ?? 0 })).filter(e => e.count > 0)
  }, [filteredEntries])

  const hasData = filteredEntries.length > 0

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Selectors */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Subject selector */}
        <div className="flex items-center gap-1 backdrop-blur-xl bg-white/60 border border-white/50 rounded-xl px-1 py-1 flex-wrap">
          {(['All', ...SUBJECTS] as const).map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedSubject === sub
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              style={
                selectedSubject === sub && sub !== 'All'
                  ? { color: SUBJECT_COLORS[sub as SubjectName], background: `${SUBJECT_COLORS[sub as SubjectName]}18` }
                  : {}
              }
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 backdrop-blur-xl bg-white/60 border border-white/50 rounded-xl px-1 py-1">
          {(['week', 'month', 'term'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                timeRange === r
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'This Term'}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Time Spent */}
          <TimeSpentCard entries={filteredEntries} />

          {/* Cognitive Level Line Chart */}
          {cognitiveData.length > 0 && <CognitiveLevelChart data={cognitiveData} />}

          {/* Emotion Bar Chart */}
          {emotionData.length > 0 && <EmotionChart data={emotionData} />}

          {/* Subject Stats — only when a specific subject is selected */}
          {selectedSubject !== 'All' && (
            <SubjectStatsCard
              subject={selectedSubject as SubjectName}
              entries={filteredByRange}
            />
          )}

          {/* Compare Toggle */}
          <div className="flex items-center justify-between py-2">
            <p className="text-sm font-semibold text-slate-600">Compare all subjects</p>
            <button
              onClick={() => setShowRadar(r => !r)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                showRadar ? 'bg-brand-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  showRadar ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {showRadar && <CompareRadarChart entries={filteredByRange} />}
        </div>
      )}
    </div>
  )
}
