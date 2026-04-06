'use client'

interface CareerData {
  riasec_scores: Record<string, number>
  holland_code: string
  top_clusters: string[]
  cluster_groups: Record<string, string[]>
  pathway_inspiration: string
  disclaimer: string
}

interface Props { data: CareerData }

const RIASEC_CONFIG: Record<string, { emoji: string; color: string; bg: string; title: string }> = {
  Realistic:    { emoji: '🔧', color: '#f97316', bg: '#fff7ed', title: 'Builder & Maker' },
  Investigative:{ emoji: '🔬', color: '#6366f1', bg: '#eef2ff', title: 'Problem Solver' },
  Artistic:     { emoji: '🎨', color: '#ec4899', bg: '#fdf2f8', title: 'Creative Thinker' },
  Social:       { emoji: '🤝', color: '#10b981', bg: '#ecfdf5', title: 'People Champion' },
  Enterprising: { emoji: '🚀', color: '#f59e0b', bg: '#fffbeb', title: 'Leader & Innovator' },
  Conventional: { emoji: '📊', color: '#3b82f6', bg: '#eff6ff', title: 'Systems Thinker' },
}

export default function CareerPathCard({ data }: Props) {
  const sorted = Object.entries(data.riasec_scores ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Career Pathway Signals</h3>
        <p className="text-xs text-slate-400">Holland RIASEC interest clusters</p>
      </div>

      {/* Holland code badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Holland Code:</span>
        <div className="flex gap-1">
          {(data.holland_code ?? '').split('').map((letter, i) => (
            <span key={i} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* Top 3 clusters */}
      <div className="grid grid-cols-3 gap-2">
        {sorted.map(([type, score], rank) => {
          const cfg = RIASEC_CONFIG[type] ?? { emoji: '⭐', color: '#6366f1', bg: '#eef2ff', title: type }
          const groups = data.cluster_groups?.[type] ?? []
          return (
            <div
              key={type}
              className="rounded-2xl overflow-hidden border border-white/50"
              style={{ background: cfg.bg }}
            >
              <div className="h-0.5" style={{ background: cfg.color }} />
              <div className="p-3">
                <div className="text-xl mb-1">{cfg.emoji}</div>
                <div className="text-[11px] font-bold text-slate-800 leading-tight mb-1">{cfg.title}</div>
                <div className="space-y-0.5">
                  {(groups.length > 0 ? groups : ['General']).slice(0, 2).map(g => (
                    <div key={g} className="text-[9px] text-slate-500 leading-tight">{g}</div>
                  ))}
                </div>
                {rank === 0 && (
                  <div
                    className="mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block border"
                    style={{ background: 'white', color: cfg.color, borderColor: cfg.color + '40' }}
                  >
                    Top match
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="flex-1 bg-white/60 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, background: cfg.color }} />
                  </div>
                  <span className="text-[9px] font-bold" style={{ color: cfg.color }}>{score}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Inspiration */}
      {data.pathway_inspiration && (
        <div className="bg-violet-50/60 border border-violet-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
          🌟 {data.pathway_inspiration}
        </div>
      )}
      {data.disclaimer && (
        <p className="text-[10px] text-slate-400 italic">{data.disclaimer}</p>
      )}
    </div>
  )
}
