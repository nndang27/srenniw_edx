'use client'

interface RadarData { [key: string]: number }

interface Props {
  data: RadarData
  topStrengths: string[]
  insightMessage: string
}

const INTEL_LABELS: Record<string, string> = {
  Logical: 'Logical', Linguistic: 'Linguistic', Spatial: 'Spatial',
  Kinesthetic: 'Kinesthetic', Musical: 'Musical',
  Interpersonal: 'Social', Intrapersonal: 'Inner', Naturalist: 'Nature',
}

const INTEL_EMOJI: Record<string, string> = {
  Logical: '🔢', Linguistic: '📝', Spatial: '🎨', Kinesthetic: '🤸',
  Musical: '🎵', Interpersonal: '🤝', Intrapersonal: '🧘', Naturalist: '🌿',
}

const STRENGTHS_COLOR = '#10b981'
const BASE_COLOR = '#6366f1'

export default function IntelligenceRadar({ data, topStrengths, insightMessage }: Props) {
  const keys = Object.keys(data)
  const n = keys.length
  const cx = 130, cy = 130, maxR = 95

  function polar(i: number, r: number) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const dataPoints = keys.map((k, i) => polar(i, ((data[k] ?? 40) / 100) * maxR))
  const poly = dataPoints.map(p => `${p.x},${p.y}`).join(' ')
  const grids = [25, 50, 75, 100]

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Multiple Intelligences</h3>
        <p className="text-xs text-slate-400">Gardner&apos;s 8-intelligence profile</p>
      </div>

      <div className="flex gap-5 items-center">
        {/* Radar SVG — balanced size */}
        <div className="shrink-0">
          <svg viewBox="0 0 260 260" width={260} height={260}>
            {grids.map(lvl => (
              <polygon
                key={lvl}
                points={keys.map((_, i) => {
                  const p = polar(i, (lvl / 100) * maxR)
                  return `${p.x},${p.y}`
                }).join(' ')}
                fill="none"
                stroke={lvl === 100 ? '#cbd5e1' : '#e2e8f0'}
                strokeWidth={lvl === 100 ? 1.2 : 0.8}
              />
            ))}
            {keys.map((_, i) => {
              const outer = polar(i, maxR)
              return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth="0.8" />
            })}
            <polygon
              points={poly}
              fill={BASE_COLOR}
              fillOpacity="0.15"
              stroke={BASE_COLOR}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {dataPoints.map((p, i) => {
              const isTop = topStrengths.includes(keys[i])
              return (
                <circle key={i} cx={p.x} cy={p.y} r={isTop ? 5 : 3.5}
                  fill={isTop ? STRENGTHS_COLOR : BASE_COLOR} stroke="white" strokeWidth="1.5" />
              )
            })}
            {keys.map((k, i) => {
              const p = polar(i, maxR + 20)
              return (
                <g key={k}>
                  <text x={p.x} y={p.y - 3} textAnchor="middle" fontSize="11">{INTEL_EMOJI[k] ?? '•'}</text>
                  <text x={p.x} y={p.y + 10} textAnchor="middle" fontSize="8" fontWeight="600" fill="#64748b">
                    {INTEL_LABELS[k] ?? k}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Score list — right side */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {keys.map(k => {
            const isTop = topStrengths.includes(k)
            const val = data[k] ?? 40
            return (
              <div key={k}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{INTEL_EMOJI[k]}</span>
                    <span className={`text-[10px] font-semibold ${isTop ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {INTEL_LABELS[k] ?? k}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${isTop ? 'text-emerald-600' : 'text-slate-400'}`}>{val}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${val}%`, background: isTop ? STRENGTHS_COLOR : BASE_COLOR, opacity: isTop ? 1 : 0.55 }} />
                </div>
              </div>
            )
          })}

          {topStrengths.length > 0 && (
            <div className="mt-1 bg-emerald-50 border border-emerald-100 rounded-xl p-2">
              <p className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide mb-1">Top Strengths</p>
              <div className="flex flex-wrap gap-1">
                {topStrengths.map(s => (
                  <span key={s} className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    {INTEL_EMOJI[s]} {INTEL_LABELS[s] ?? s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {insightMessage && (
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
          ✨ {insightMessage}
        </div>
      )}
    </div>
  )
}
