'use client'
import { useMemo } from 'react'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { getStreakCount } from '@/lib/journal'
import { useInsights } from '@/hooks/useInsights'
import { AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

import EmotionCard      from '@/components/insights/EmotionCard'
import MilestonePathway from '@/components/insights/MilestonePathway'
import IntelligenceRadar from '@/components/insights/IntelligenceRadar'
import VARKCard         from '@/components/insights/VARKCard'
import CareerPathCard   from '@/components/insights/CareerPathCard'
import PersonalityCard  from '@/components/insights/PersonalityCard'

// ─── Glass card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg overflow-hidden transition-transform duration-200 hover:scale-[1.005] ${className}`}>
      {children}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />
}


// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const { entries } = useJournalEntries()
  const streak = useMemo(() => getStreakCount(entries), [entries])
  const childAge = useMemo(() => {
    try { return parseInt(JSON.parse(localStorage.getItem('childProfile') ?? '{}').age) || 9 }
    catch { return 9 }
  }, [])

  const { data, loading } = useInsights(entries, childAge, streak)

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (!data && loading) {
    return (
      <div className="px-4 pb-12 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={`h-72 ${i < 1 ? 'md:col-span-2' : ''}`} />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="px-4 pb-12 pt-2">

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-3.5 mb-4">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Formative insights — not a diagnosis.</span>{' '}
          Generated from journal patterns to spark meaningful conversations.
        </p>
      </div>

      {/* ── Dashboard grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 1 ── Multiple Intelligences (full width) */}
        <GlassCard className="md:col-span-2">
          <div className="p-5">
            {loading ? <Skeleton className="h-64" /> : (
              <IntelligenceRadar
                data={data.intelligences.radar_data}
                topStrengths={data.intelligences.top_strengths}
                insightMessage={data.intelligences.insight_message}
              />
            )}
          </div>
        </GlassCard>

        {/* 2 ── Emotional Wellbeing (flip card) */}
        <GlassCard>
          <div className="p-5">
            {loading ? <Skeleton className="h-96" /> : (
              <EmotionCard data={data.emotion} />
            )}
          </div>
        </GlassCard>

        {/* 3 ── Cognition Milestone Pathway */}
        <GlassCard>
          <div className="p-5">
            {loading ? <Skeleton className="h-96" /> : (
              <MilestonePathway data={data.cognition} />
            )}
          </div>
        </GlassCard>

        {/* 4 ── VARK */}
        <GlassCard>
          <div className="p-5">
            {loading ? <Skeleton className="h-64" /> : (
              <VARKCard data={data.vark} />
            )}
          </div>
        </GlassCard>

        {/* 5 ── Personality OCEAN */}
        <GlassCard>
          <div className="p-5">
            {loading ? <Skeleton className="h-64" /> : (
              <PersonalityCard data={data.personality} />
            )}
          </div>
        </GlassCard>

        {/* 6 ── Career Pathway (full width) */}
        <GlassCard className="md:col-span-2">
          <div className="p-5">
            {loading ? <Skeleton className="h-56" /> : (
              <CareerPathCard data={data.career} />
            )}
          </div>
        </GlassCard>

        {/* 7 ── Bloom trend line (visible if ≥2 weekly points) */}
        {data.cognition.weekly_trend.length >= 2 && (
          <GlassCard className="md:col-span-2">
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900">Bloom&apos;s Level Trend</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Average cognitive level per month (1=Remember → 5=Evaluate)
                {data.cognition.adjusted_bloom_level !== undefined && (
                  <> · decay-adjusted avg: <strong>{data.cognition.adjusted_bloom_level}</strong></>
                )}
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={data.cognition.weekly_trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: 'none' }}
                    formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Bloom level']}
                  />
                  <Line type="monotone" dataKey="level" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}


      </div>
    </div>
  )
}
