'use client'
import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface VARKData {
  vark_distribution: Record<string, number>
  primary_hint: string
  multimodal_suggestion: string
  disclaimer: string
}

interface Props { data: VARKData }

const VARK_CONFIG = {
  Visual:     { color: '#6366f1', bg: '#eef2ff', emoji: '👁️', desc: 'Learns through images, charts, videos' },
  Auditory:   { color: '#f59e0b', bg: '#fffbeb', emoji: '🎧', desc: 'Learns through listening & discussion' },
  Reading:    { color: '#10b981', bg: '#ecfdf5', emoji: '📖', desc: 'Learns through reading & writing' },
  Kinesthetic:{ color: '#ef4444', bg: '#fef2f2', emoji: '🤸', desc: 'Learns through movement & hands-on' },
}

export default function VARKCard({ data }: Props) {
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const keys = ['Visual', 'Auditory', 'Reading', 'Kinesthetic']
  const dist = data.vark_distribution ?? {}
  const primary = data.primary_hint ?? keys[0]

  return (
    <div className="flex flex-col gap-4 relative" onClick={() => setActivePopup(null)}>
      <div>
        <h3 className="text-lg font-bold text-slate-900">Learning Style (VARK)</h3>
      </div>

      {/* Primary badge */}
      <div
        className="flex items-center gap-3 rounded-xl p-3 border"
        style={{ background: VARK_CONFIG[primary as keyof typeof VARK_CONFIG]?.bg ?? '#f8fafc',
                 borderColor: VARK_CONFIG[primary as keyof typeof VARK_CONFIG]?.color + '40' }}
      >
        <span className="text-2xl">{VARK_CONFIG[primary as keyof typeof VARK_CONFIG]?.emoji ?? '📚'}</span>
        <div>
          <div className="text-xs text-slate-500">Primary style</div>
          <div className="text-sm font-bold" style={{ color: VARK_CONFIG[primary as keyof typeof VARK_CONFIG]?.color }}>
            {primary} Learner
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2.5">
        {keys.map(k => {
          const cfg = VARK_CONFIG[k as keyof typeof VARK_CONFIG]
          const pct = dist[k] ?? 0
          const isTop = k === primary
          return (
            <div key={k} className="relative cursor-pointer group" onClick={(e) => { e.stopPropagation(); setActivePopup(activePopup === k ? null : k) }}>
              <div className="flex items-center gap-2.5 transition-colors hover:bg-slate-50 p-1 -m-1 rounded">
                <span className="text-sm shrink-0">{cfg.emoji}</span>
                <span className="text-[11px] font-semibold text-slate-600 w-20 shrink-0">{k}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: cfg.color, opacity: isTop ? 1 : 0.55 }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 w-8 text-right">{pct}%</span>
              </div>
              {activePopup === k && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActivePopup(null) }} />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl z-50">
                    <p className="font-bold mb-0.5">{k}</p>
                    <p className="opacity-90">{cfg.desc}</p>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Suggestion */}
      {data.multimodal_suggestion && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="analysis" className="border-none">
            <AccordionTrigger className="bg-slate-50/80 hover:bg-slate-100 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700">
              Extend Analysis
            </AccordionTrigger>
            <AccordionContent className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed mt-2 shadow-sm">
              💡 {data.multimodal_suggestion}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
