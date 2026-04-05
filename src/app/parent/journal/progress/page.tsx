'use client'
import { useMemo } from 'react'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { getStreakCount, getEntriesForMonth, getEntriesLast30Days } from '@/lib/journal'
import { Card, CardContent } from '@/components/ui/card'
import { Flame } from 'lucide-react'

const EMOTION_COLORS: Record<string, string> = {
  Curious: '#6b8fe1',
  Excited: '#f97316',
  Disengaged: '#94a3b8',
  Anxious: '#f59e0b',
  Happy: '#10b981',
}

const SUBJECT_COLORS: Record<string, string> = {
  Maths: '#6b8fe1',
  Science: '#10b981',
  English: '#f97316',
  HSIE: '#8b5cf6',
  'Creative Arts': '#ec4899',
  PE: '#f59e0b',
}

function CalendarHeatmap() {
  const { entries } = useJournalEntries()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthEntries = useMemo(
    () => getEntriesForMonth(entries, year, month),
    [entries, year, month]
  )
  const loggedDates = useMemo(
    () => new Set(monthEntries.map(e => e.date)),
    [monthEntries]
  )

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // 0=Sun,1=Mon... convert to Mon-start: (dayOfWeek + 6) % 7
  const startOffset = (firstDay.getDay() + 6) % 7
  const todayDate = now.getDate()

  const days: { day: number; status: 'future' | 'logged' | 'missed' }[] = []
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    if (i > todayDate) {
      days.push({ day: i, status: 'future' })
    } else if (loggedDates.has(dateStr)) {
      days.push({ day: i, status: 'logged' })
    } else {
      days.push({ day: i, status: 'missed' })
    }
  }

  const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-5">
        <h3 className="font-semibold text-slate-800 mb-4">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-slate-400 pb-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {days.map(({ day, status }) => (
            <div
              key={day}
              title={status === 'logged' ? 'Logged' : status === 'missed' ? 'Missed' : ''}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all
                ${status === 'logged' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                  : status === 'missed' ? 'bg-slate-100 text-slate-400'
                  : 'bg-slate-50 text-slate-300'}`}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 ring-1 ring-emerald-300 inline-block" /> Logged</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 inline-block" /> Missed</span>
        </div>
      </CardContent>
    </Card>
  )
}

function CognitiveTrendChart() {
  const { entries } = useJournalEntries()
  const recent = useMemo(() => getEntriesLast30Days(entries), [entries])

  const W = 400
  const H = 180
  const PAD = { top: 16, right: 16, bottom: 28, left: 28 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  // Build day-by-day data for last 30 days
  const today = new Date()
  const dayData: { date: string; level: number | null; subject: string | null }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const entry = recent.find(e => e.date === dateStr)
    dayData.push({ date: dateStr, level: entry?.cognitiveLevel ?? null, subject: entry?.subject ?? null })
  }

  const filledPoints = dayData
    .map((d, i) => d.level !== null ? {
      x: PAD.left + (i / 29) * chartW,
      y: PAD.top + chartH - ((d.level - 1) / 4) * chartH,
      level: d.level,
      subject: d.subject,
    } : null)
    .filter(Boolean) as { x: number; y: number; level: number; subject: string }[]

  const polyline = filledPoints.map(p => `${p.x},${p.y}`).join(' ')

  const gridLevels = [1, 2, 3, 4, 5]

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Cognitive Level — Last 30 Days</h3>
        <p className="text-xs text-slate-400 mb-4">Bloom&apos;s Taxonomy level over time</p>
        {recent.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-slate-400">No entries yet — start journalling!</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {/* Grid */}
            {gridLevels.map(lvl => {
              const y = PAD.top + chartH - ((lvl - 1) / 4) * chartH
              return (
                <g key={lvl}>
                  <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
                  <text x={PAD.left - 6} y={y + 4} fontSize="9" textAnchor="end" fill="#94a3b8">L{lvl}</text>
                </g>
              )
            })}
            {/* X-axis labels */}
            {[0, 14, 29].map(i => {
              const d = new Date(today)
              d.setDate(d.getDate() - (29 - i))
              const x = PAD.left + (i / 29) * chartW
              return (
                <text key={i} x={x} y={H - 6} fontSize="9" textAnchor="middle" fill="#94a3b8">
                  {d.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </text>
              )
            })}
            {/* Line */}
            {polyline && (
              <polyline points={polyline} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {/* Dots colored by subject */}
            {filledPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="5"
                fill={SUBJECT_COLORS[p.subject] || '#10b981'}
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        )}
        {/* Subject legend */}
        <div className="flex flex-wrap gap-3 mt-2">
          {Object.entries(SUBJECT_COLORS).map(([sub, color]) => (
            <span key={sub} className="flex items-center gap-1 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {sub}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmotionBarChart() {
  const { entries } = useJournalEntries()
  const now = new Date()
  const monthEntries = useMemo(
    () => getEntriesForMonth(entries, now.getFullYear(), now.getMonth()),
    [entries]
  )

  const emotions = ['Curious', 'Excited', 'Disengaged', 'Anxious', 'Happy']
  const emojis: Record<string, string> = {
    Curious: '🤔', Excited: '😊', Disengaged: '😴', Anxious: '😰', Happy: '😄',
  }
  const counts = emotions.map(e => monthEntries.filter(en => en.emotion === e).length)
  const maxCount = Math.max(...counts, 1)

  const W = 320
  const H = 160
  const barW = 42
  const gap = 16
  const maxBarH = 100
  const baseY = H - 30

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Emotion Distribution — This Month</h3>
        <p className="text-xs text-slate-400 mb-4">How often each mood appeared</p>
        {monthEntries.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-slate-400">No entries this month</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {emotions.map((em, i) => {
              const barH = (counts[i] / maxCount) * maxBarH
              const x = 20 + i * (barW + gap)
              const y = baseY - barH
              return (
                <g key={em}>
                  <rect
                    x={x} y={y} width={barW} height={barH}
                    rx="6"
                    fill={EMOTION_COLORS[em]}
                    opacity="0.85"
                  />
                  {counts[i] > 0 && (
                    <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={EMOTION_COLORS[em]}>
                      {counts[i]}
                    </text>
                  )}
                  <text x={x + barW / 2} y={baseY + 14} textAnchor="middle" fontSize="18">{emojis[em]}</text>
                  <text x={x + barW / 2} y={baseY + 26} textAnchor="middle" fontSize="8" fill="#94a3b8">{em}</text>
                </g>
              )
            })}
          </svg>
        )}
      </CardContent>
    </Card>
  )
}

export default function ProgressPage() {
  const { entries } = useJournalEntries()
  const streak = useMemo(() => getStreakCount(entries), [entries])
  const now = new Date()
  const thisMonthEntries = useMemo(
    () => getEntriesForMonth(entries, now.getFullYear(), now.getMonth()),
    [entries]
  )

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-5">
      <div className="mt-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Progress Tracker</h2>
        <p className="text-slate-500 text-sm mt-1">Your child&apos;s learning journey at a glance.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame size={18} className="text-orange-500" />
              <span className="text-2xl font-bold text-slate-900">{streak}</span>
            </div>
            <p className="text-xs font-medium text-slate-500">Day streak</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 mb-1">{thisMonthEntries.length}</div>
            <p className="text-xs font-medium text-slate-500">This month</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {thisMonthEntries.length > 0
                ? (thisMonthEntries.reduce((s, e) => s + e.cognitiveLevel, 0) / thisMonthEntries.length).toFixed(1)
                : '—'}
            </div>
            <p className="text-xs font-medium text-slate-500">Avg level</p>
          </CardContent>
        </Card>
      </div>

      <CalendarHeatmap />
      <CognitiveTrendChart />
      <EmotionBarChart />
    </div>
  )
}
