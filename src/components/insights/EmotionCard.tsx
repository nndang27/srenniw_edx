'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts'

type TimeMode = 'week' | 'month' | 'year'

interface ChartPoint {
  day: string
  score: number
  emoji: string
  emotion?: string
  parent_note?: string | null
}

interface EmotionData {
  today: { emotion: string; score: number; message: string }
  ratio_status: string
  chart_data_week: ChartPoint[]
  chart_data_month: ChartPoint[]
  chart_data_year: ChartPoint[]
  alert?: { type: string; message: string } | null
  perma_scores?: Record<string, number>
}

interface Props { data: EmotionData }

// Custom emoji dot for line chart
function EmojiDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx = 0, cy = 0, payload } = props
  return (
    <text x={cx} y={cy} dy={8} textAnchor="middle" fontSize="20">
      {payload?.emoji ?? '😐'}
    </text>
  )
}

const MODE_LABELS: Record<TimeMode, string> = { week: 'Week', month: 'Month', year: 'Year' }
const RATIO_COLOR: Record<string, string> = {
  'Flourishing':    'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Growing':        'text-blue-600 bg-blue-50 border-blue-200',
  'Seeking Balance':'text-amber-700 bg-amber-50 border-amber-200',
  'Needs Support':  'text-rose-700 bg-rose-50 border-rose-200',
  'Starting':       'text-slate-600 bg-slate-50 border-slate-200',
}

export default function EmotionCard({ data }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState<TimeMode>('week')

  const chartData: Record<TimeMode, ChartPoint[]> = {
    week:  data.chart_data_week,
    month: data.chart_data_month,
    year:  data.chart_data_year,
  }

  const todayEmoji = data.today.emotion.split(' ')[0] ?? '😐'
  const todayLabel = data.today.emotion.split(' ').slice(1).join(' ') || 'Neutral'
  const statusClass = RATIO_COLOR[data.ratio_status] ?? RATIO_COLOR.Starting

  return (
    <div className="flex flex-col gap-0">
      {/* Alert banner */}
      {data.alert && (
        <div className="mb-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
          ⚠️ {data.alert.message}
        </div>
      )}

      {/* Flip container */}
      <div
        className="relative cursor-pointer"
        style={{ height: 380, perspective: '1000px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, type: 'spring', stiffness: 240, damping: 22 }}
        >
          {/* ── Front: Today's emotion ── */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center justify-between p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center w-full">
              <h3 className="text-lg font-bold text-slate-900">Emotional Wellbeing</h3>
            </div>

            <motion.div
              className="text-8xl filter drop-shadow-md"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              {todayEmoji}
            </motion.div>

            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${statusClass}`}>
                {data.ratio_status}
              </span>
              <p className="text-slate-700 text-xs leading-relaxed max-w-xs">{data.today.message}</p>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-2">
              <RefreshCw className="w-3 h-3" />
              <span>Tap to see history</span>
            </div>
          </div>

          {/* ── Back: Trend chart ── */}
          <div
            className="absolute inset-0 bg-white rounded-2xl border border-slate-100 flex flex-col p-5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Emotion Trend</h3>
                <p className="text-xs text-slate-400">Tap to go back</p>
              </div>
              <div className="flex gap-1">
                {(['week', 'month', 'year'] as TimeMode[]).map(m => (
                  <button
                    key={m}
                    onClick={e => { e.stopPropagation(); setMode(m) }}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                      mode === m
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                {data.ratio_status}
              </span>
            </div>

            <div className="flex-1 w-full">
              {chartData[mode].length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData[mode]} margin={{ top: 24, right: 16, bottom: 8, left: -16 }}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      dy={6}
                    />
                    <YAxis hide domain={[0.5, 5.5]} />
                    <Tooltip
                      cursor={{ stroke: '#E5E7EB', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const pt = payload[0].payload as ChartPoint
                        return (
                          <div className="bg-white border border-slate-100 rounded-xl shadow-md p-2.5 text-center max-w-[160px]">
                            <p className="text-xl mb-0.5">{pt.emoji}</p>
                            <p className="text-xs font-bold text-slate-700">{pt.emotion}</p>
                            <p className="text-[10px] text-slate-500">{pt.score}/5</p>
                            {pt.parent_note && (
                              <p className="text-[9px] text-slate-400 mt-1 leading-tight">{pt.parent_note}</p>
                            )}
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      dot={<EmojiDot />}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  No data for this period
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
