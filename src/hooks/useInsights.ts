import { useState, useEffect, useMemo } from 'react'
import type { JournalEntry } from '@/lib/journal'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InsightsMeta {
  entry_count: number
  subject_avgs: Record<string, number>
  demo: boolean
  demo_days?: number
  student?: string
}

export interface InsightsData {
  intelligences: {
    radar_data: Record<string, number>
    top_strengths: string[]
    insight_message: string
  }
  vark: {
    vark_distribution: Record<string, number>
    primary_hint: string
    multimodal_suggestion: string
    disclaimer: string
  }
  cognition: {
    status_badge: string
    position_value: number
    milestones: Array<{ id: number; label: string }>
    development_insight: string
    recommended_support: string
    average_bloom_level: number
    adjusted_bloom_level?: number
    weekly_trend: Array<{ week: string; level: number }>
  }
  emotion: {
    today: { emotion: string; score: number; message: string; parent_note?: string | null }
    ratio_status: string
    positivity_ratio: number
    chart_data_week:  Array<{ day: string; score: number; emoji: string; emotion?: string; parent_note?: string | null }>
    chart_data_month: Array<{ day: string; score: number; emoji: string; emotion?: string }>
    chart_data_year:  Array<{ day: string; score: number; emoji: string; emotion?: string; month?: string }>
    alert: { type: string; message: string } | null
    perma_scores: Record<string, number>
  }
  personality: {
    traits: Record<string, number>
    superpower: string
    insight: string
    gentle_reminder?: string | null
  }
  career: {
    riasec_scores: Record<string, number>
    holland_code: string
    top_clusters: string[]
    cluster_groups: Record<string, string[]>
    pathway_inspiration: string
    disclaimer: string
  }
  meta?: InsightsMeta
}

// ─── Local fallback computation ───────────────────────────────────────────────

function computeLocalInsights(entries: JournalEntry[]): InsightsData {
  const INTEL_W: Record<string, Partial<Record<string, number>>> = {
    Maths: { Logical: 1 }, Science: { Naturalist: 0.6, Logical: 0.4 },
    English: { Linguistic: 1 }, HSIE: { Interpersonal: 0.7, Linguistic: 0.3 },
    'Creative Arts': { Spatial: 0.6, Musical: 0.4 }, PE: { Kinesthetic: 1 },
  }
  const KEYS = ['Logical','Linguistic','Spatial','Kinesthetic','Musical','Interpersonal','Intrapersonal','Naturalist']
  const acc: Record<string, { t: number; c: number }> = {}
  KEYS.forEach(k => { acc[k] = { t: 0, c: 0 } })
  entries.forEach(e => {
    const w = INTEL_W[e.subject] ?? {}
    Object.entries(w).forEach(([k, wt]) => { acc[k].t += e.cognitiveLevel * (wt as number); acc[k].c += wt as number })
  })
  const radar: Record<string, number> = {}
  KEYS.forEach(k => { radar[k] = acc[k].c > 0 ? Math.min(100, Math.max(20, Math.round(20 + acc[k].t / acc[k].c / 5 * 80))) : 45 })
  const topStr = [...KEYS].sort((a, b) => radar[b] - radar[a]).slice(0, 2)

  const VARK_W: Record<string, Partial<Record<string, number>>> = {
    Maths: { Reading: 0.5, Visual: 0.5 }, Science: { Visual: 0.5, Kinesthetic: 0.3, Reading: 0.2 },
    English: { Reading: 0.8, Auditory: 0.2 }, HSIE: { Reading: 0.5, Auditory: 0.3, Visual: 0.2 },
    'Creative Arts': { Visual: 0.6, Kinesthetic: 0.4 }, PE: { Kinesthetic: 0.8, Auditory: 0.2 },
  }
  const va: Record<string, number> = { Visual: 0, Auditory: 0, Reading: 0, Kinesthetic: 0 }
  entries.forEach(e => { const w = VARK_W[e.subject] ?? {}; Object.entries(w).forEach(([k, wt]) => { va[k] += wt as number }) })
  const vt = Object.values(va).reduce((a, b) => a + b, 0) || 1
  const varkDist = Object.fromEntries(Object.entries(va).map(([k, v]) => [k, Math.round(v / vt * 100)]))
  const primaryV = Object.entries(varkDist).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Visual'

  const avg = entries.length ? entries.reduce((s, e) => s + e.cognitiveLevel, 0) / entries.length : 3
  const d = avg - 3.0
  const status = d < -0.5 ? 'Building Foundations' : d > 0.5 ? 'Exploring Ahead' : 'On Track'
  const pos = d < -0.5 ? Math.max(0.5, 1 + d) : d > 0.5 ? Math.min(1.9, 1 + d * 0.6) : 1 + d * 0.4

  const ESCORE: Record<string, number> = { Excited: 5, Happy: 5, Curious: 4, Neutral: 3, Anxious: 2, Disengaged: 1 }
  const EMOJIS: Record<number, string> = { 5: '🤩', 4: '🤔', 3: '😐', 2: '😰', 1: '🥱' }
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const last = sorted[sorted.length - 1]
  const todayE = last?.emotion ?? 'Neutral'
  const todayS = ESCORE[todayE] ?? 3
  const posR = entries.length ? entries.filter(e => ['Excited','Happy','Curious'].includes(e.emotion)).length / entries.length : 0
  const chartW = sorted.slice(-7).map(e => { const sc = ESCORE[e.emotion] ?? 3; return { day: e.date.slice(5), date: e.date, score: sc, emoji: EMOJIS[sc] ?? '😐', emotion: e.emotion, parent_note: e.notes || null } })

  const n = entries.length || 1
  const bloom45 = entries.filter(e => e.cognitiveLevel >= 4).length / n
  const curious = entries.filter(e => e.emotion === 'Curious').length / n
  const subDiv  = new Set(entries.map(e => e.subject)).size
  const happy   = entries.filter(e => ['Happy','Excited'].includes(e.emotion)).length / n
  const anxious = entries.filter(e => ['Anxious','Disengaged'].includes(e.emotion)).length / n
  const social  = entries.filter(e => ['HSIE','PE'].includes(e.subject)).length / n
  const traits = {
    Openness: Math.min(100, Math.round(bloom45 * 40 + curious * 30 + subDiv / 6 * 30)),
    Conscientiousness: Math.min(100, Math.round(40 + bloom45 * 30 + Math.min(n / 30, 1) * 30)),
    Extraversion: Math.min(100, Math.round(social * 40 + happy * 30)),
    Agreeableness: Math.min(100, Math.round(happy * 50 + social * 20)),
    Neuroticism: Math.min(100, Math.round(10 + anxious * 90)),
  }

  const riasec: Record<string, number> = {
    Realistic: (radar.Kinesthetic + radar.Naturalist) / 2,
    Investigative: (radar.Logical + radar.Intrapersonal) / 2,
    Artistic: (radar.Spatial + radar.Musical + radar.Linguistic) / 3,
    Social: (radar.Interpersonal + radar.Linguistic) / 2,
    Enterprising: (radar.Interpersonal + radar.Logical) / 2,
    Conventional: radar.Logical * 0.7 + 30 * 0.3,
  }
  const maxR = Math.max(...Object.values(riasec), 1)
  const riasecN = Object.fromEntries(Object.entries(riasec).map(([k, v]) => [k, Math.min(100, Math.round(v / maxR * 100))]))
  const topC = Object.entries(riasecN).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k)

  return {
    intelligences: { radar_data: radar, top_strengths: topStr, insight_message: `Strong potential in ${topStr.join(' & ')}!` },
    vark: { vark_distribution: varkDist, primary_hint: primaryV, multimodal_suggestion: 'Try a variety of approaches.', disclaimer: 'Multimodal learning is best!' },
    cognition: { status_badge: status, position_value: pos, milestones: [{ id: 0, label: 'Year 3' }, { id: 1, label: 'Year 4 (Current)' }, { id: 2, label: 'Year 5' }], development_insight: 'Making steady progress!', recommended_support: 'Keep exploring daily.', average_bloom_level: Math.round(avg * 10) / 10, weekly_trend: [] },
    emotion: { today: { emotion: `${EMOJIS[todayS] ?? '😐'} ${todayE}`, score: todayS, message: 'Today is going okay.', parent_note: null }, ratio_status: posR > 0.7 ? 'Flourishing' : posR > 0.5 ? 'Growing' : posR > 0.3 ? 'Seeking Balance' : 'Needs Support', positivity_ratio: Math.round(posR * 100) / 100, chart_data_week: chartW, chart_data_month: [], chart_data_year: [], alert: null, perma_scores: { Positive: Math.round(posR * 100), Engagement: Math.round(avg / 5 * 100), Relationships: 50, Meaning: Math.min(100, Math.round(n / 20 * 100)), Achievement: Math.round(bloom45 * 100) } },
    personality: { traits, superpower: 'Unique Learner', insight: 'A wonderful combination of traits!', gentle_reminder: null },
    career: { riasec_scores: riasecN, holland_code: topC.map(k => k[0]).join('') + 'X', top_clusters: topC, cluster_groups: {}, pathway_inspiration: `Potential in ${topC.join(' & ')} areas!`, disclaimer: "Interests keep growing — use as a fun lens!" },
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type InsightsSource = 'local' | 'api' | 'demo'

export function useInsights(entries: JournalEntry[], childAge = 9, streak = 0) {
  const [data, setData]       = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [source, setSource]   = useState<InsightsSource>('local')
  const [demoMode, setDemoMode] = useState(false)

  const localData = useMemo(() => {
    if (entries.length === 0) return null
    return computeLocalInsights(entries)
  }, [entries])

  // Load demo insights from backend (backend reads mock_data_400days.json)
  const loadDemo = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
    setLoading(true)
    setDemoMode(true)
    fetch(`${backendUrl}/api/parent/insights/demo`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: InsightsData) => { setData(d); setSource('demo') })
      .catch(() => { setData(null); setDemoMode(false) })
      .finally(() => setLoading(false))
  }

  const clearDemo = () => {
    setDemoMode(false)
    setData(localData)
    setSource('local')
  }

  // Auto-load demo when no real entries exist (on first mount)
  useEffect(() => {
    if (entries.length === 0) {
      loadDemo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch live data from backend when entries are available
  useEffect(() => {
    if (demoMode) return
    if (entries.length < 2) {
      setData(localData)
      setSource('local')
      return
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
    const controller = new AbortController()
    setLoading(true)
    fetch(`${backendUrl}/api/parent/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: entries.map(e => ({
          date: e.date, subject: e.subject,
          cognitiveLevel: e.cognitiveLevel,
          emotion: e.emotion, notes: e.notes,
        })),
        child_age: childAge,
        curriculum_benchmark: 3.0,
        app_usage_streak: streak,
      }),
      signal: controller.signal,
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((d: InsightsData) => { setData(d); setSource('api') })
      .catch(() => { setData(localData); setSource('local') })
      .finally(() => setLoading(false))

    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, childAge, streak, demoMode])

  return { data: data ?? localData, loading, source, demoMode, loadDemo, clearDemo }
}
