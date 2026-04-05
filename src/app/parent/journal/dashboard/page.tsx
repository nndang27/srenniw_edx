'use client'
import { useMemo } from 'react'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { getEntriesForMonth } from '@/lib/journal'
import type { JournalEntry } from '@/lib/journal'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Star } from 'lucide-react'

// ─── Intelligence computation ────────────────────────────────────────────────

const INTELLIGENCES = [
  'Visual-Spatial',
  'Logical-Math',
  'Linguistic',
  'Bodily-Kinesthetic',
  'Musical',
  'Interpersonal',
  'Intrapersonal',
  'Naturalist',
] as const

type Intelligence = typeof INTELLIGENCES[number]

// Subject → Intelligence weights
const SUBJECT_WEIGHTS: Record<string, Partial<Record<Intelligence, number>>> = {
  Maths:          { 'Logical-Math': 1.0 },
  Science:        { 'Naturalist': 0.6, 'Logical-Math': 0.4 },
  English:        { 'Linguistic': 1.0 },
  HSIE:           { 'Interpersonal': 0.7, 'Linguistic': 0.3 },
  'Creative Arts':{ 'Visual-Spatial': 0.6, 'Musical': 0.4 },
  PE:             { 'Bodily-Kinesthetic': 1.0 },
}

function computeIntelligences(entries: JournalEntry[]): Record<Intelligence, number> {
  const scores: Record<Intelligence, { total: number; count: number }> = {} as never
  INTELLIGENCES.forEach(i => { scores[i] = { total: 0, count: 0 } })

  // Accumulate subject-weighted cognitive scores
  entries.forEach(e => {
    const weights = SUBJECT_WEIGHTS[e.subject]
    if (!weights) return
    Object.entries(weights).forEach(([intel, weight]) => {
      scores[intel as Intelligence].total += e.cognitiveLevel * (weight as number)
      scores[intel as Intelligence].count += weight as number
    })
  })

  // Intrapersonal: based on journaling frequency + emotion diversity
  const emotionSet = new Set(entries.map(e => e.emotion))
  const intraDiversity = emotionSet.size / 5 // 0-1
  const intraFrequency = Math.min(entries.length / 30, 1) // up to 30 days
  scores['Intrapersonal'].total += (intraDiversity * 0.5 + intraFrequency * 0.5) * 5
  scores['Intrapersonal'].count += 1

  // Normalize to 0-100
  const result = {} as Record<Intelligence, number>
  INTELLIGENCES.forEach(intel => {
    const { total, count } = scores[intel]
    const avg = count > 0 ? total / count : 0
    // Min score 20, scale (0-5 avg) → 20-100
    result[intel] = Math.round(20 + (avg / 5) * 80)
  })
  return result
}

// ─── Radar chart ─────────────────────────────────────────────────────────────

function RadarChart({ scores }: { scores: Record<Intelligence, number> }) {
  const cx = 160
  const cy = 160
  const maxR = 110
  const n = INTELLIGENCES.length

  function polarXY(i: number, r: number) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const gridLevels = [25, 50, 75, 100]

  const dataPoints = INTELLIGENCES.map((intel, i) => {
    const r = (scores[intel] / 100) * maxR
    return polarXY(i, r)
  })
  const dataPolyline = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  const gridPolygons = gridLevels.map(level => {
    const r = (level / 100) * maxR
    const points = INTELLIGENCES.map((_, i) => {
      const p = polarXY(i, r)
      return `${p.x},${p.y}`
    }).join(' ')
    return { level, points }
  })

  // Labels positioned slightly beyond maxR
  const labelR = maxR + 22
  const labelOffsets: Partial<Record<Intelligence, [number, number]>> = {}

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto h-auto">
      {/* Grid polygons */}
      {gridPolygons.map(({ level, points }) => (
        <polygon key={level} points={points} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {INTELLIGENCES.map((_, i) => {
        const outer = polarXY(i, maxR)
        return (
          <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
            stroke="#e2e8f0" strokeWidth="1" />
        )
      })}
      {/* Data polygon */}
      <polygon
        points={dataPolyline}
        fill="#10b981"
        fillOpacity="0.18"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {INTELLIGENCES.map((intel, i) => {
        const p = polarXY(i, labelR)
        const shortened = intel === 'Bodily-Kinesthetic' ? 'Kinesthetic'
          : intel === 'Logical-Math' ? 'Logical'
          : intel === 'Visual-Spatial' ? 'Visual'
          : intel
        return (
          <text
            key={intel}
            x={p.x}
            y={p.y + 4}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#475569"
          >
            {shortened}
          </text>
        )
      })}
      {/* Grid level labels */}
      <text x={cx + 4} y={cy - (25 / 100) * maxR + 3} fontSize="7" fill="#cbd5e1">25</text>
      <text x={cx + 4} y={cy - (75 / 100) * maxR + 3} fontSize="7" fill="#cbd5e1">75</text>
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubjectStrengthCards({ entries }: { entries: JournalEntry[] }) {
  const subjects = ['Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE']
  const emojis: Record<string, string> = {
    Maths: '🔢', Science: '🔬', English: '📖', HSIE: '🌏', 'Creative Arts': '🎨', PE: '⚽',
  }

  const stats = subjects.map(sub => {
    const subEntries = entries.filter(e => e.subject === sub)
    const avg = subEntries.length > 0
      ? subEntries.reduce((s, e) => s + e.cognitiveLevel, 0) / subEntries.length
      : 0
    const stars = avg === 0 ? 0 : avg <= 2 ? 1 : avg <= 3.5 ? 2 : 3
    return { sub, avg, stars, count: subEntries.length }
  }).sort((a, b) => b.avg - a.avg)

  const strongest = stats[0]

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Subject Strengths</h3>
          {strongest.count > 0 && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
              🏆 Strongest: {strongest.sub}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {stats.map(({ sub, stars, count }) => (
            <div key={sub} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xl">{emojis[sub]}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{sub}</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  {[1, 2, 3].map(s => (
                    <Star
                      key={s}
                      size={10}
                      className={s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                    />
                  ))}
                  {count === 0 && <span className="text-[10px] text-slate-400 ml-1">No data</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LearningStyleInsight({ entries }: { entries: JournalEntry[] }) {
  const insight = useMemo(() => {
    if (entries.length === 0) return null

    // Find most common emotion
    const emotionCounts: Record<string, number> = {}
    entries.forEach(e => { emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1 })
    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Find top subject by avg cognitive level
    const subjectAvg: Record<string, number[]> = {}
    entries.forEach(e => {
      if (!subjectAvg[e.subject]) subjectAvg[e.subject] = []
      subjectAvg[e.subject].push(e.cognitiveLevel)
    })
    const topSubject = Object.entries(subjectAvg)
      .map(([sub, levels]) => ({ sub, avg: levels.reduce((a, b) => a + b, 0) / levels.length }))
      .sort((a, b) => b.avg - a.avg)[0]?.sub

    const styleMap: Record<string, string> = {
      Curious: 'inquiry and exploration',
      Excited: 'enthusiastic hands-on tasks',
      Happy: 'playful and positive activities',
      Anxious: 'structured guidance and support',
      Disengaged: 'shorter, varied activities',
    }

    const style = styleMap[topEmotion] || 'varied learning approaches'
    return {
      line1: `Your child learns best through ${style}.`,
      line2: topSubject ? `They show highest engagement in ${topSubject}.` : '',
    }
  }, [entries])

  if (!insight) return null

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
      <CardContent className="p-5">
        <h3 className="font-semibold text-slate-800 mb-2">🎯 Learning Style Insight</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{insight.line1}</p>
        {insight.line2 && <p className="text-sm text-slate-700 leading-relaxed">{insight.line2}</p>}
      </CardContent>
    </Card>
  )
}

function EmotionalAlert({ entries }: { entries: JournalEntry[] }) {
  const alert = useMemo(() => {
    const last7 = new Date()
    last7.setDate(last7.getDate() - 7)
    const last7Str = last7.toISOString().split('T')[0]
    const recent = entries.filter(e => e.date >= last7Str)

    const anxiousCount = recent.filter(e => e.emotion === 'Anxious').length
    const disengagedCount = recent.filter(e => e.emotion === 'Disengaged').length

    if (anxiousCount >= 3) {
      return `Your child has shown Anxious ${anxiousCount} times this week — consider checking in with their teacher.`
    }
    if (disengagedCount >= 3) {
      return `Your child has appeared Disengaged ${disengagedCount} times this week — they may need a change of pace.`
    }
    return null
  }, [entries])

  if (!alert) return null

  return (
    <Card className="border-none shadow-sm bg-amber-50 border border-amber-200">
      <CardContent className="p-5">
        <div className="flex gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">Emotional Pattern Alert</h3>
            <p className="text-sm text-amber-700">{alert}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CareerPathways({ scores }: { scores: Record<Intelligence, number> }) {
  const careerMap: Record<Intelligence, { title: string; icon: string }[]> = {
    'Logical-Math':         [{ title: 'Engineer', icon: '🔧' }, { title: 'Data Scientist', icon: '📊' }, { title: 'Accountant', icon: '💰' }],
    'Linguistic':           [{ title: 'Writer', icon: '✍️' }, { title: 'Teacher', icon: '👩‍🏫' }, { title: 'Journalist', icon: '📰' }],
    'Visual-Spatial':       [{ title: 'Architect', icon: '🏛️' }, { title: 'Designer', icon: '🎨' }, { title: 'Filmmaker', icon: '🎬' }],
    'Bodily-Kinesthetic':   [{ title: 'Athlete', icon: '⚽' }, { title: 'Physiotherapist', icon: '💪' }, { title: 'Chef', icon: '👨‍🍳' }],
    'Musical':              [{ title: 'Musician', icon: '🎵' }, { title: 'Sound Designer', icon: '🎛️' }, { title: 'Music Teacher', icon: '🎹' }],
    'Interpersonal':        [{ title: 'Psychologist', icon: '🧠' }, { title: 'Social Worker', icon: '🤝' }, { title: 'Manager', icon: '👔' }],
    'Intrapersonal':        [{ title: 'Researcher', icon: '🔬' }, { title: 'Philosopher', icon: '📚' }, { title: 'Entrepreneur', icon: '💡' }],
    'Naturalist':           [{ title: 'Scientist', icon: '🧬' }, { title: 'Environmentalist', icon: '🌿' }, { title: 'Veterinarian', icon: '🐾' }],
  }

  const top3 = (Object.entries(scores) as [Intelligence, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const careers = Array.from(new Set(
    top3.flatMap(([intel]) => careerMap[intel].map(c => c))
  )).slice(0, 3)

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-5">
        <h3 className="font-semibold text-slate-800 mb-1">🚀 Career Pathway Suggestions</h3>
        <p className="text-xs text-slate-400 mb-4">Based on top intelligences: {top3.map(([i]) => i).join(', ')}</p>
        <div className="grid grid-cols-3 gap-3">
          {careers.map(({ title, icon }) => (
            <div key={title} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-b from-emerald-50 to-white border border-emerald-100 text-center">
              <span className="text-3xl">{icon}</span>
              <span className="text-xs font-semibold text-slate-700">{title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MonthlyGrowth({ entries }: { entries: JournalEntry[] }) {
  const { thisAvg, lastAvg, pct } = useMemo(() => {
    const now = new Date()
    const thisMonth = getEntriesForMonth(entries, now.getFullYear(), now.getMonth())
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonth = getEntriesForMonth(entries, lastMonthDate.getFullYear(), lastMonthDate.getMonth())

    const avg = (arr: JournalEntry[]) =>
      arr.length > 0 ? arr.reduce((s, e) => s + e.cognitiveLevel, 0) / arr.length : null

    const thisAvg = avg(thisMonth)
    const lastAvg = avg(lastMonth)
    const pct = thisAvg && lastAvg
      ? Math.round(((thisAvg - lastAvg) / lastAvg) * 100)
      : null

    return { thisAvg, lastAvg, pct }
  }, [entries])

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-5">
        <h3 className="font-semibold text-slate-800 mb-4">📅 Monthly Growth</h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Last month avg</p>
            <p className="text-2xl font-bold text-slate-600">{lastAvg ? lastAvg.toFixed(1) : '—'}</p>
          </div>
          <div className="flex-1 flex flex-col items-center">
            {pct !== null ? (
              <>
                {pct > 0
                  ? <TrendingUp size={24} className="text-emerald-500" />
                  : pct < 0
                  ? <TrendingDown size={24} className="text-red-400" />
                  : <Minus size={24} className="text-slate-400" />}
                <span className={`text-sm font-bold mt-1 ${pct > 0 ? 'text-emerald-600' : pct < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                  {pct > 0 ? '+' : ''}{pct}%
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400 text-center">Not enough data<br/>to compare</span>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">This month avg</p>
            <p className="text-2xl font-bold text-slate-900">{thisAvg ? thisAvg.toFixed(1) : '—'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { entries } = useJournalEntries()
  const scores = useMemo(() => computeIntelligences(entries), [entries])

  if (entries.length < 7) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24">
        <div className="mt-2 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Child Insights</h2>
          <p className="text-slate-500 text-sm mt-1">Intelligence profile and learning patterns.</p>
        </div>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <span className="text-5xl mb-4">🌱</span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Not enough data yet</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              Keep journalling! You need at least 7 entries to unlock your child&apos;s intelligence profile and insights.
            </p>
            <p className="text-emerald-600 font-semibold text-sm mt-4">
              {entries.length} / 7 entries logged
            </p>
            <div className="w-full max-w-xs mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(entries.length / 7) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-5">
      <div className="mt-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Child Insights</h2>
        <p className="text-slate-500 text-sm mt-1">Intelligence profile and learning patterns.</p>
      </div>

      {/* Emotional alert first if any */}
      <EmotionalAlert entries={entries} />

      {/* Intelligence Radar */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Multiple Intelligence Profile</h3>
          <p className="text-xs text-slate-400 mb-4">Based on {entries.length} journal entries</p>
          <RadarChart scores={scores} />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {INTELLIGENCES.map(intel => {
              const short = intel === 'Bodily-Kinesthetic' ? 'Kinesthetic'
                : intel === 'Logical-Math' ? 'Logical'
                : intel === 'Visual-Spatial' ? 'Visual'
                : intel
              return (
                <div key={intel} className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{scores[intel]}</div>
                  <div className="text-[9px] text-slate-400 leading-tight">{short}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <SubjectStrengthCards entries={entries} />
      <LearningStyleInsight entries={entries} />
      <CareerPathways scores={scores} />
      <MonthlyGrowth entries={entries} />
    </div>
  )
}
