'use client'
import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface PersonalityData {
  traits: Record<string, number>
  superpower: string
  insight: string
  gentle_reminder?: string | null
}

interface Props { data: PersonalityData }

const TRAIT_MAP = [
  { key: 'Openness',          label: 'Exploration & Creativity',  icon: '🎨', color: '#6366f1' },
  { key: 'Conscientiousness', label: 'Persistence & Responsibility', icon: '✅', color: '#22c55e' },
  { key: 'Extraversion',      label: 'Social Energy',             icon: '👥', color: '#f59e0b' },
  { key: 'Agreeableness',     label: 'Empathy & Cooperation',     icon: '💗', color: '#f43f5e' },
  { key: 'Neuroticism',       label: 'Emotional Sensitivity',     icon: '🧠', color: '#a855f7' },
]

const TRAIT_DEFS: Record<string, string> = {
  Openness: 'Intellectual curiosity and creative imagination.',
  Conscientiousness: 'Self-discipline and goal-directed behavior.',
  Extraversion: 'Energy, positive emotions, and sociability.',
  Agreeableness: 'Tendency to be compassionate and cooperative.',
  Neuroticism: 'Tendency toward negative emotions and sensitivity.',
}

export default function PersonalityCard({ data }: Props) {
  const [activePopup, setActivePopup] = useState<string | null>(null)
  
  const traits = data.traits ?? {}

  const dominant = TRAIT_MAP.reduce((best, t) =>
    (traits[t.key] ?? 0) > (traits[best.key] ?? 0) ? t : best
  , TRAIT_MAP[0])

  return (
    <div className="flex flex-col gap-4 relative" onClick={() => setActivePopup(null)}>
      <div>
        <h3 className="text-lg font-bold text-slate-900">Personality Profile</h3>
      </div>

      {/* Primary badge */}
      <div className="flex items-center gap-3 rounded-xl p-3 border"
        style={{ background: dominant.color + '12', borderColor: dominant.color + '40' }}>
        <span className="text-2xl">{dominant.icon}</span>
        <div>
          <div className="text-xs text-slate-500">Primary trait</div>
          <div className="text-sm font-bold" style={{ color: dominant.color }}>{data.superpower}</div>
        </div>
      </div>

      {/* Trait bars */}
      <div className="space-y-2.5">
        {TRAIT_MAP.map(t => {
          const val = traits[t.key] ?? 0
          const isTop = t.key === dominant.key
          return (
            <div key={t.key} className="relative cursor-pointer group" onClick={(e) => { e.stopPropagation(); setActivePopup(activePopup === t.key ? null : t.key) }}>
              <div className="flex items-center gap-2.5 transition-colors hover:bg-slate-50 rounded p-1 -m-1">
                <span className="text-sm shrink-0">{t.icon}</span>
                <span className="text-[11px] font-semibold text-slate-600 w-24 shrink-0 truncate">{t.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${val}%`, background: t.color, opacity: isTop ? 1 : 0.55 }} />
                </div>
                <span className="text-xs font-bold text-slate-600 w-8 text-right">{val}%</span>
              </div>
              {activePopup === t.key && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActivePopup(null) }} />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl z-50">
                    <p className="font-bold mb-0.5">{t.key}</p>
                    <p className="opacity-90">{TRAIT_DEFS[t.key]}</p>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Insight */}
      {(data.insight || data.gentle_reminder) && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="analysis" className="border-none">
            <AccordionTrigger className="bg-slate-50/80 hover:bg-slate-100 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700">
              Extend Analysis
            </AccordionTrigger>
            <AccordionContent className="bg-violet-50/60 border border-violet-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed mt-2 shadow-sm space-y-2">
              {data.insight && <div>✨ {data.insight}</div>}
              {data.gentle_reminder && (
                <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2 text-amber-800">
                  💡 {data.gentle_reminder}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
