'use client'
import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

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

const RIASEC_DEFS: Record<string, string> = {
  Realistic: 'Practical, hands-on, prefers working with things over people.',
  Investigative: 'Analytical, intellectual, prefers working with ideas.',
  Artistic: 'Creative, intuitive, prefers unstructured environments.',
  Social: 'Helpful, empathetic, prefers working with people.',
  Enterprising: 'Persuasive, leadership-oriented, prefers influencing others.',
  Conventional: 'Organized, detail-oriented, prefers structured tasks.',
}

export default function CareerPathCard({ data }: Props) {
  const [activePopup, setActivePopup] = useState<string | null>(null)
  
  const sorted = Object.entries(data.riasec_scores ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-4 relative" onClick={() => setActivePopup(null)}>
      <div>
        <h3 className="text-lg font-bold text-slate-900">Career Pathway Signals</h3>
      </div>

      {/* Top 3 clusters */}
      <div className="grid grid-cols-3 gap-2">
        {sorted.map(([type, score], rank) => {
          const cfg = RIASEC_CONFIG[type] ?? { emoji: '⭐', color: '#6366f1', bg: '#eef2ff', title: type }
          const groups = data.cluster_groups?.[type] ?? []
          return (
            <div
              key={type}
              className="relative rounded-2xl overflow-visible border border-white/50 cursor-pointer transition-transform hover:-translate-y-1"
              style={{ background: cfg.bg }}
              onClick={(e) => { e.stopPropagation(); setActivePopup(activePopup === type ? null : type) }}
            >
              <div className="h-0.5 rounded-t-2xl" style={{ background: cfg.color }} />
              <div className="p-3">
                <div className="text-xl mb-1">{cfg.emoji}</div>
                <div className="text-[11px] font-bold text-slate-800 leading-tight mb-1">{cfg.title}</div>
                <div className="space-y-0.5">
                  {(groups.length > 0 ? groups : ['General']).slice(0, 2).map(g => (
                    <div key={g} className="text-[9px] text-slate-500 leading-tight truncate">{g}</div>
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
              {/* Tooltip Popup */}
              {activePopup === type && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActivePopup(null) }} />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl z-50">
                    <p className="font-bold mb-0.5">{type}</p>
                    <p className="opacity-90">{RIASEC_DEFS[type]}</p>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Inspiration */}
      {(data.pathway_inspiration || data.disclaimer) && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="analysis" className="border-none">
            <AccordionTrigger className="bg-slate-50/80 hover:bg-slate-100 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700">
              Extend Analysis
            </AccordionTrigger>
            <AccordionContent className="bg-violet-50/60 border border-violet-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed mt-2 shadow-sm">
              {data.pathway_inspiration && <div className="mb-2">🌟 {data.pathway_inspiration}</div>}
              {data.disclaimer && <p className="text-[10px] text-slate-500 italic mt-1">{data.disclaimer}</p>}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
