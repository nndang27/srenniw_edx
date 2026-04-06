'use client'
import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'

interface Milestone { id: number; label: string }
interface CognitionData {
  status_badge: string
  position_value: number
  milestones: Milestone[]
  development_insight: string
  recommended_support: string
  average_bloom_level: number
}

interface Props { data: CognitionData }

const STATUS_META: Record<string, { title: string; color: string; bg: string; border: string }> = {
  'Building Foundations': { title: 'FOUNDATION BUILDER',  color: '#f59e0b', bg: 'bg-amber-50',   border: 'border-amber-200' },
  'On Track':             { title: 'CONFIDENT NAVIGATOR', color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Exploring Ahead':      { title: 'FRONTIER EXPLORER',   color: '#6366f1', bg: 'bg-indigo-50',  border: 'border-indigo-200' },
}

const STEPS = 8

export default function MilestonePathway({ data }: Props) {
  const status    = data.status_badge ?? 'On Track'
  const posRaw    = Math.max(0, Math.min(2, data.position_value ?? 1))
  const milestones = data.milestones?.length >= 3
    ? data.milestones
    : [
        { id: 0, label: 'Year 2 Expectations' },
        { id: 1, label: 'Year 3 (Current)' },
        { id: 2, label: 'Year 4 Expectations' },
      ]

  const meta = STATUS_META[status] ?? STATUS_META['On Track']
  const currentStep = Math.round(posRaw * STEPS)
  const totalSteps  = STEPS * 2

  type Bubble = { step: number; kind: 'milestone' | 'small'; milestoneIdx?: number; label?: string }
  const bubbles: Bubble[] = []
  for (let s = 0; s <= totalSteps; s++) {
    if (s === 0)           bubbles.push({ step: s, kind: 'milestone', milestoneIdx: 0, label: milestones[0].label })
    else if (s === STEPS)  bubbles.push({ step: s, kind: 'milestone', milestoneIdx: 1, label: milestones[1].label })
    else if (s === totalSteps) bubbles.push({ step: s, kind: 'milestone', milestoneIdx: 2, label: milestones[2].label })
    else                   bubbles.push({ step: s, kind: 'small' })
  }

  function milestoneNum(label: string, fallback: number): string {
    const m = label.match(/\d+/)
    return m ? m[0] : String(fallback + 2)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Cognitive Growth</h3>
        <p className="text-xs text-slate-400">Developmental pathway · avg Bloom level {data.average_bloom_level}/5</p>
      </div>

      {/* Track area — white bg */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 pt-6 pb-4">
        {/* CURRENT PROGRESS label */}
        <div className="relative mb-1 h-5">
          <motion.div
            className="absolute"
            style={{ left: `${(currentStep / totalSteps) * 100}%`, transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span className="whitespace-nowrap text-[9px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
              CURRENT PROGRESS
            </span>
          </motion.div>
        </div>

        {/* Bubble chain */}
        <div className="relative flex items-center justify-between">
          {bubbles.map((b, idx) => {
            const isCurrent   = b.step === currentStep
            const isPast      = b.step < currentStep
            const isMilestone = b.kind === 'milestone'
            const mIdx = b.milestoneIdx ?? 0

            if (isMilestone) {
              const ringColor = isCurrent ? meta.color : isPast ? '#10b981' : '#cbd5e1'
              const bgColor   = isCurrent ? meta.color + '18' : isPast ? '#f0fdf4' : '#f8fafc'
              return (
                <div key={idx} className="relative flex flex-col items-center z-10">
                  <motion.div
                    className="w-11 h-11 rounded-full border-2 flex items-center justify-center shadow-sm"
                    style={{ borderColor: ringColor, background: bgColor }}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.04, type: 'spring', stiffness: 200 }}
                  >
                    {isCurrent ? (
                      <>
                        <span className="text-xl">🧒</span>
                        <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{ background: meta.color }} />
                      </>
                    ) : (
                      <span className="text-xs font-bold font-mono" style={{ color: isPast ? '#10b981' : '#94a3b8' }}>
                        [{milestoneNum(b.label ?? '', mIdx)}]
                      </span>
                    )}
                  </motion.div>
                  <motion.span
                    className="mt-1.5 text-[8px] font-semibold text-center uppercase tracking-wide text-slate-500 whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    style={{ maxWidth: 70 }}
                  >
                    {b.label}
                  </motion.span>
                </div>
              )
            }

            // Small bubble
            const smallColor = isPast ? '#bbf7d0' : '#e2e8f0'
            const smallBorder = isPast ? '#86efac' : '#cbd5e1'
            return (
              <motion.div key={idx}
                className="w-4 h-4 rounded-full border"
                style={{ background: smallColor, borderColor: smallBorder }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.025, type: 'spring', stiffness: 300 }}
              />
            )
          })}
        </div>
      </div>

      {/* Info card */}
      <div className={`rounded-2xl border p-4 ${meta.bg} ${meta.border}`}>
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-bold uppercase tracking-wide" style={{ color: meta.color }}>
            {meta.title}
          </h4>
          <Compass size={16} style={{ color: meta.color }} className="shrink-0 mt-0.5" />
        </div>
        <p className="text-xs text-slate-700 leading-relaxed mb-2">{data.development_insight}</p>
        <p className="text-[11px] text-slate-500">
          <span className="font-semibold" style={{ color: meta.color }}>Suggested: </span>
          {data.recommended_support}
        </p>
      </div>
    </div>
  )
}
