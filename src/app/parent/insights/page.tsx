'use client'
import { useMemo } from 'react'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import type { JournalEntry } from '@/lib/journal'
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, BookOpen } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Intelligence =
  | 'Visual-Spatial' | 'Logical-Math' | 'Linguistic'
  | 'Bodily-Kinesthetic' | 'Musical' | 'Interpersonal'
  | 'Intrapersonal' | 'Naturalist'

type VARKKey = 'Visual' | 'Auditory' | 'Read-Write' | 'Kinesthetic'
type HollandKey = 'Realistic' | 'Investigative' | 'Artistic' | 'Social' | 'Enterprising' | 'Conventional'
type PERMAKey = 'Positive' | 'Engagement' | 'Relationships' | 'Meaning' | 'Achievement'
type OCEANKey = 'Openness' | 'Conscientiousness' | 'Extraversion' | 'Neuroticism' | 'Agreeableness'
type SubjectKey = 'Maths' | 'Science' | 'English' | 'HSIE' | 'Creative Arts' | 'PE'

// ─── Config ───────────────────────────────────────────────────────────────────

const INTELLIGENCES: Intelligence[] = [
  'Visual-Spatial', 'Logical-Math', 'Linguistic', 'Bodily-Kinesthetic',
  'Musical', 'Interpersonal', 'Intrapersonal', 'Naturalist',
]

const INTEL_WEIGHTS: Record<string, Partial<Record<Intelligence, number>>> = {
  Maths:          { 'Logical-Math': 1.0 },
  Science:        { 'Naturalist': 0.6, 'Logical-Math': 0.4 },
  English:        { 'Linguistic': 1.0 },
  HSIE:           { 'Interpersonal': 0.7, 'Linguistic': 0.3 },
  'Creative Arts':{ 'Visual-Spatial': 0.6, 'Musical': 0.4 },
  PE:             { 'Bodily-Kinesthetic': 1.0 },
}

const VARK_WEIGHTS: Record<string, Partial<Record<VARKKey, number>>> = {
  Maths:          { 'Read-Write': 0.5, 'Visual': 0.5 },
  Science:        { 'Visual': 0.5, 'Kinesthetic': 0.3, 'Read-Write': 0.2 },
  English:        { 'Read-Write': 0.8, 'Auditory': 0.2 },
  HSIE:           { 'Read-Write': 0.5, 'Auditory': 0.3, 'Visual': 0.2 },
  'Creative Arts':{ 'Visual': 0.6, 'Kinesthetic': 0.4 },
  PE:             { 'Kinesthetic': 0.8, 'Auditory': 0.2 },
}

const HOLLAND_WEIGHTS: Record<string, Partial<Record<HollandKey, number>>> = {
  Maths:          { 'Investigative': 0.7, 'Conventional': 0.3 },
  Science:        { 'Investigative': 0.6, 'Realistic': 0.4 },
  English:        { 'Artistic': 0.4, 'Social': 0.4, 'Conventional': 0.2 },
  HSIE:           { 'Social': 0.6, 'Enterprising': 0.4 },
  'Creative Arts':{ 'Artistic': 1.0 },
  PE:             { 'Realistic': 0.7, 'Social': 0.3 },
}

const CAREER_PATHS: Record<HollandKey, { title: string; emoji: string; careers: string[]; color: string; bg: string }> = {
  Realistic:      { title: 'Builder & Maker', emoji: '🔧', careers: ['Engineer', 'Athlete', 'Architect'], color: '#f97316', bg: '#fff7ed' },
  Investigative:  { title: 'Problem Solver', emoji: '🔬', careers: ['Scientist', 'Doctor', 'Mathematician'], color: '#6366f1', bg: '#eef2ff' },
  Artistic:       { title: 'Creative Thinker', emoji: '🎨', careers: ['Designer', 'Musician', 'Writer'], color: '#ec4899', bg: '#fdf2f8' },
  Social:         { title: 'People Champion', emoji: '🤝', careers: ['Teacher', 'Counsellor', 'Social Worker'], color: '#10b981', bg: '#ecfdf5' },
  Enterprising:   { title: 'Leader & Innovator', emoji: '🚀', careers: ['Entrepreneur', 'Manager', 'Lawyer'], color: '#f59e0b', bg: '#fffbeb' },
  Conventional:   { title: 'Systems Thinker', emoji: '📊', careers: ['Accountant', 'Data Analyst', 'Administrator'], color: '#3b82f6', bg: '#eff6ff' },
}

const SUBJECTS: SubjectKey[] = ['Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE']
const SUBJECT_COLORS: Record<SubjectKey, string> = {
  Maths: '#6366f1', Science: '#10b981', English: '#f59e0b',
  HSIE: '#3b82f6', 'Creative Arts': '#ec4899', PE: '#f97316',
}

const BLOOM_LABELS = ['', 'Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate']
const POSITIVE_EMOTIONS = new Set(['Excited', 'Happy', 'Curious'])

const ZPD_ACTIVITIES: Record<SubjectKey, Record<number, string>> = {
  Maths:          { 1: 'Count objects at home', 2: 'Explain a concept to a sibling', 3: 'Solve real-world problems', 4: 'Compare two methods', 5: 'Design a new maths game' },
  Science:        { 1: 'Observe nature around you', 2: 'Watch a science video together', 3: 'Run a simple kitchen experiment', 4: 'Compare two living things', 5: 'Design your own experiment' },
  English:        { 1: 'Read a picture book aloud', 2: 'Retell a story in your words', 3: 'Write a short paragraph', 4: 'Spot persuasive techniques in ads', 5: 'Write a persuasive letter' },
  HSIE:           { 1: 'Talk about your neighbourhood', 2: 'Look at a map together', 3: 'Research a local community role', 4: 'Compare two communities', 5: 'Plan a community improvement project' },
  'Creative Arts':{ 1: 'Draw something you see', 2: 'Explain what a painting makes you feel', 3: 'Copy an art style you like', 4: 'Compare two artists', 5: 'Create an original artwork with a message' },
  PE:             { 1: 'Go for a walk together', 2: 'Explain the rules of a sport', 3: 'Play a backyard game', 4: 'Analyse your own movement', 5: 'Design a new fitness routine' },
}

// ─── Computations ─────────────────────────────────────────────────────────────

function computeIntelligences(entries: JournalEntry[]): Record<Intelligence, number> {
  const scores: Record<Intelligence, { total: number; count: number }> = {} as never
  INTELLIGENCES.forEach(i => { scores[i] = { total: 0, count: 0 } })
  entries.forEach(e => {
    const weights = INTEL_WEIGHTS[e.subject]
    if (!weights) return
    Object.entries(weights).forEach(([intel, w]) => {
      scores[intel as Intelligence].total += e.cognitiveLevel * (w as number)
      scores[intel as Intelligence].count += w as number
    })
  })
  const emotionSet = new Set(entries.map(e => e.emotion))
  const intraDiversity = emotionSet.size / 5
  const intraFrequency = Math.min(entries.length / 30, 1)
  scores['Intrapersonal'].total += (intraDiversity * 0.5 + intraFrequency * 0.5) * 5
  scores['Intrapersonal'].count += 1
  const result = {} as Record<Intelligence, number>
  INTELLIGENCES.forEach(intel => {
    const { total, count } = scores[intel]
    result[intel] = Math.round(20 + (count > 0 ? total / count : 0) / 5 * 80)
  })
  return result
}

function computeVARK(entries: JournalEntry[]): Record<VARKKey, number> {
  const acc: Record<VARKKey, { total: number; count: number }> = {
    Visual: { total: 0, count: 0 }, Auditory: { total: 0, count: 0 },
    'Read-Write': { total: 0, count: 0 }, Kinesthetic: { total: 0, count: 0 },
  }
  entries.forEach(e => {
    const weights = VARK_WEIGHTS[e.subject]
    if (!weights) return
    Object.entries(weights).forEach(([k, w]) => {
      acc[k as VARKKey].total += w as number
      acc[k as VARKKey].count += 1
    })
  })
  const result = {} as Record<VARKKey, number>
  ;(['Visual', 'Auditory', 'Read-Write', 'Kinesthetic'] as VARKKey[]).forEach(k => {
    result[k] = acc[k].count > 0 ? Math.round((acc[k].total / acc[k].count) * 100) : 0
  })
  const max = Math.max(...Object.values(result), 1)
  ;(['Visual', 'Auditory', 'Read-Write', 'Kinesthetic'] as VARKKey[]).forEach(k => {
    result[k] = Math.round((result[k] / max) * 100)
  })
  return result
}

function computeHolland(entries: JournalEntry[]): [HollandKey, number][] {
  const acc: Record<HollandKey, number> = {
    Realistic: 0, Investigative: 0, Artistic: 0, Social: 0, Enterprising: 0, Conventional: 0,
  }
  entries.forEach(e => {
    const weights = HOLLAND_WEIGHTS[e.subject]
    if (!weights) return
    Object.entries(weights).forEach(([k, w]) => {
      acc[k as HollandKey] += (e.cognitiveLevel / 5) * (w as number)
    })
  })
  return (Object.entries(acc) as [HollandKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3)
}

function computePERMA(entries: JournalEntry[]): Record<PERMAKey, number> {
  if (entries.length === 0) return { Positive: 0, Engagement: 0, Relationships: 0, Meaning: 0, Achievement: 0 }
  const positive = entries.filter(e => POSITIVE_EMOTIONS.has(e.emotion)).length / entries.length
  const engagement = entries.reduce((s, e) => s + e.cognitiveLevel, 0) / entries.length / 5
  const social = entries.filter(e => e.subject === 'HSIE' || e.subject === 'PE').length / entries.length
  const meaning = Math.min(entries.length / 20, 1)
  const achievement = entries.filter(e => e.cognitiveLevel >= 4).length / entries.length
  return {
    Positive:      Math.round(positive * 100),
    Engagement:    Math.round(engagement * 100),
    Relationships: Math.round(social * 100),
    Meaning:       Math.round(meaning * 100),
    Achievement:   Math.round(achievement * 100),
  }
}

function computeGrowthVelocity(entries: JournalEntry[]): { week: string; level: number }[] {
  if (entries.length === 0) return []
  const byWeek: Record<string, number[]> = {}
  entries.forEach(e => {
    const d = new Date(e.date + 'T00:00:00')
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const key = monday.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
    byWeek[key] = byWeek[key] ?? []
    byWeek[key].push(e.cognitiveLevel)
  })
  return Object.entries(byWeek)
    .slice(-6)
    .map(([week, levels]) => ({
      week,
      level: Math.round((levels.reduce((s, v) => s + v, 0) / levels.length) * 10) / 10,
    }))
}

function computeOCEAN(entries: JournalEntry[]): Record<OCEANKey, number> {
  if (entries.length === 0) return { Openness: 50, Conscientiousness: 50, Extraversion: 50, Neuroticism: 10, Agreeableness: 50 }
  const subjectSet = new Set(entries.map(e => e.subject))
  const avgLevel = entries.reduce((s, e) => s + e.cognitiveLevel, 0) / entries.length
  const curiousRatio = entries.filter(e => e.emotion === 'Curious').length / entries.length
  const openness = Math.min(100, Math.round((subjectSet.size / 6 * 50) + (curiousRatio * 30) + (avgLevel / 5 * 20)))

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  let conscScore = 50
  if (sorted.length >= 4) {
    const half = Math.floor(sorted.length / 2)
    const firstAvg = sorted.slice(0, half).reduce((s, e) => s + e.cognitiveLevel, 0) / half
    const lastAvg  = sorted.slice(half).reduce((s, e) => s + e.cognitiveLevel, 0) / (sorted.length - half)
    const trendBonus = (lastAvg - firstAvg) / 4 * 30
    conscScore = Math.min(100, Math.max(20, Math.round(50 + trendBonus + (entries.length / 30 * 20))))
  }

  const socialSessions = entries.filter(e => e.subject === 'HSIE' || e.subject === 'PE').length
  const happyRatio = entries.filter(e => e.emotion === 'Happy' || e.emotion === 'Excited').length / entries.length
  const extraversion = Math.min(100, Math.round((socialSessions / entries.length * 60) + (happyRatio * 40)))

  const anxiousRatio = entries.filter(e => e.emotion === 'Anxious').length / entries.length
  const neuroticism = Math.min(100, Math.round(10 + anxiousRatio * 90))

  const positiveRatio = entries.filter(e => POSITIVE_EMOTIONS.has(e.emotion)).length / entries.length
  const agreeableness = Math.min(100, Math.round((positiveRatio * 60) + (socialSessions / entries.length * 40)))

  return { Openness: openness, Conscientiousness: conscScore, Extraversion: extraversion, Neuroticism: neuroticism, Agreeableness: agreeableness }
}

function computeMastery(entries: JournalEntry[]): Record<SubjectKey, { avg: number; trend: number; status: string; weekOn: number | null }> {
  const result = {} as Record<SubjectKey, { avg: number; trend: number; status: string; weekOn: number | null }>
  SUBJECTS.forEach(sub => {
    const subEntries = entries.filter(e => e.subject === sub).sort((a, b) => a.date.localeCompare(b.date))
    if (subEntries.length === 0) {
      result[sub] = { avg: 0, trend: 0, status: 'no data', weekOn: null }
      return
    }
    const avg = subEntries.reduce((s, e) => s + e.cognitiveLevel, 0) / subEntries.length
    let trend = 0
    if (subEntries.length >= 3) {
      const n = subEntries.length
      const xMean = (n - 1) / 2
      const yMean = avg
      let num = 0, den = 0
      subEntries.forEach((e, i) => {
        num += (i - xMean) * (e.cognitiveLevel - yMean)
        den += (i - xMean) ** 2
      })
      trend = den > 0 ? num / den : 0
    }
    const mastery = avg / 5
    let status = ''
    let weekOn: number | null = null
    if (mastery >= 0.8) {
      status = 'mastered'
    } else if (trend > 0.1) {
      const weeksLeft = Math.ceil((5 - avg) / (trend * 2))
      weekOn = Math.min(weeksLeft, 12)
      status = 'on track'
    } else if (trend < -0.05) {
      status = 'check in'
    } else {
      status = 'growing'
    }
    result[sub] = { avg, trend, status, weekOn }
  })
  return result
}

function computeZPD(entries: JournalEntry[]): Record<SubjectKey, { current: number; target: number; activity: string }> {
  const result = {} as Record<SubjectKey, { current: number; target: number; activity: string }>
  SUBJECTS.forEach(sub => {
    const subEntries = entries.filter(e => e.subject === sub)
    const current = subEntries.length
      ? Math.round(subEntries.reduce((s, e) => s + e.cognitiveLevel, 0) / subEntries.length)
      : 2
    const target = Math.min(5, current + 1)
    result[sub] = { current, target, activity: ZPD_ACTIVITIES[sub]?.[target] ?? 'Explore further' }
  })
  return result
}

function getPiagetStage(age: number): { stage: string; desc: string; color: string } {
  if (age < 7)  return { stage: 'Pre-operational', desc: 'Symbolic thinking, imagination, language developing', color: '#f59e0b' }
  if (age < 12) return { stage: 'Concrete Operational', desc: 'Logical thinking with hands-on experience, understands cause & effect', color: '#10b981' }
  return { stage: 'Formal Operational', desc: 'Abstract reasoning, hypothetical thinking, systematic problem solving', color: '#6366f1' }
}

function getEriksonStage(age: number, entries: JournalEntry[]): { stage: string; alert: string; color: string } {
  const anxiousRatio = entries.length ? entries.filter(e => e.emotion === 'Anxious' || e.emotion === 'Disengaged').length / entries.length : 0
  if (age >= 6 && age <= 11) {
    const alert = anxiousRatio > 0.3
      ? "Let's check in — your child may be feeling uncertain about their abilities. Celebrate small wins daily."
      : 'Your child is building a sense of competence. Keep encouraging effort over outcomes.'
    return { stage: 'Industry vs Inferiority', alert, color: '#3b82f6' }
  }
  if (age >= 12 && age <= 18) {
    const alert = anxiousRatio > 0.3
      ? "Let's check in — exploring identity can feel overwhelming. Create space for open conversations."
      : 'Your child is exploring who they are. Support their interests and affirm their unique strengths.'
    return { stage: 'Identity vs Role Confusion', alert, color: '#8b5cf6' }
  }
  return { stage: 'Industry vs Inferiority', alert: 'Encourage curiosity and effort every day.', color: '#3b82f6' }
}

// ─── Glass Card wrapper ────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg overflow-hidden transition-transform duration-200 hover:scale-[1.01] ${className}`}>
      {children}
    </div>
  )
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function IntelRadar({ scores }: { scores: Record<Intelligence, number> }) {
  const cx = 160, cy = 160, maxR = 110
  const n = INTELLIGENCES.length
  function polarXY(i: number, r: number) {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }
  const dataPoints = INTELLIGENCES.map((intel, i) => polarXY(i, (scores[intel] / 100) * maxR))
  const dataPolyline = dataPoints.map(p => `${p.x},${p.y}`).join(' ')
  const gridLevels = [25, 50, 75, 100]
  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[260px] mx-auto h-auto">
      {gridLevels.map(level => (
        <polygon key={level}
          points={INTELLIGENCES.map((_, i) => { const p = polarXY(i, (level / 100) * maxR); return `${p.x},${p.y}` }).join(' ')}
          fill="none" stroke="#e2e8f0" strokeWidth="1"
        />
      ))}
      {INTELLIGENCES.map((_, i) => {
        const outer = polarXY(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth="1" />
      })}
      <polygon points={dataPolyline} fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
      ))}
      {INTELLIGENCES.map((intel, i) => {
        const p = polarXY(i, maxR + 22)
        const label = intel === 'Bodily-Kinesthetic' ? 'Kinesthetic'
          : intel === 'Logical-Math' ? 'Logical'
          : intel === 'Visual-Spatial' ? 'Visual'
          : intel
        return (
          <text key={intel} x={p.x} y={p.y + 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── PERMA Circle ─────────────────────────────────────────────────────────────

function PERMACircle({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 30 30)" />
        <text x="30" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{value}</text>
      </svg>
      <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{label}</span>
    </div>
  )
}

// ─── Mastery Status badge ──────────────────────────────────────────────────────

function masteryLabel(status: string): string {
  if (status === 'check in') return "Let's check in ⚠️"
  if (status === 'growing') return 'Still growing'
  if (status === 'mastered') return 'Mastered ✓'
  if (status === 'on track') return 'On track'
  return 'No data yet'
}

function masteryColor(status: string): string {
  if (status === 'mastered') return 'text-emerald-600 bg-emerald-50'
  if (status === 'on track') return 'text-blue-600 bg-blue-50'
  if (status === 'check in') return 'text-amber-700 bg-amber-50'
  return 'text-slate-500 bg-slate-50'
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { entries } = useJournalEntries()

  const intelScores  = useMemo(() => computeIntelligences(entries), [entries])
  const vark         = useMemo(() => computeVARK(entries), [entries])
  const topHolland   = useMemo(() => computeHolland(entries), [entries])
  const perma        = useMemo(() => computePERMA(entries), [entries])
  const growth       = useMemo(() => computeGrowthVelocity(entries), [entries])
  const ocean        = useMemo(() => computeOCEAN(entries), [entries])
  const mastery      = useMemo(() => computeMastery(entries), [entries])
  const zpd          = useMemo(() => computeZPD(entries), [entries])

  const childAge = useMemo(() => {
    try {
      const p = JSON.parse(localStorage.getItem('childProfile') ?? '{}')
      return parseInt(p.age) || 9
    } catch { return 9 }
  }, [])

  const piaget  = useMemo(() => getPiagetStage(childAge), [childAge])
  const erikson = useMemo(() => getEriksonStage(childAge, entries), [childAge, entries])

  const varkKeys: VARKKey[] = ['Visual', 'Auditory', 'Read-Write', 'Kinesthetic']
  const varkColors: Record<VARKKey, string> = {
    Visual: '#6366f1', Auditory: '#f59e0b', 'Read-Write': '#10b981', Kinesthetic: '#ef4444',
  }

  const permaConfig: { key: PERMAKey; label: string; color: string }[] = [
    { key: 'Positive',      label: 'Positive\nEmotion',  color: '#f59e0b' },
    { key: 'Engagement',    label: 'Engagement',          color: '#6366f1' },
    { key: 'Relationships', label: 'Relationships',        color: '#10b981' },
    { key: 'Meaning',       label: 'Meaning',              color: '#ec4899' },
    { key: 'Achievement',   label: 'Achievement',          color: '#3b82f6' },
  ]

  const oceanConfig: { key: OCEANKey; color: string; desc: string }[] = [
    { key: 'Openness',          color: '#6366f1', desc: 'Curious, creative, open to new ideas' },
    { key: 'Conscientiousness', color: '#10b981', desc: 'Organised, diligent, self-disciplined' },
    { key: 'Extraversion',      color: '#f59e0b', desc: 'Sociable, energetic, assertive' },
    { key: 'Neuroticism',       color: '#ef4444', desc: 'Emotional sensitivity, stress response' },
    { key: 'Agreeableness',     color: '#ec4899', desc: 'Cooperative, empathetic, trusting' },
  ]

  if (entries.length === 0) {
    return (
      <div className="px-6 py-16 flex flex-col items-center text-center max-w-sm mx-auto gap-4">
        <BookOpen size={48} className="text-slate-200" />
        <h3 className="text-lg font-bold text-slate-700">No data yet</h3>
        <p className="text-sm text-slate-500">
          Insights are generated from your journal entries. Start journaling after lessons to unlock learning intelligence predictions.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-12 pt-2">

      {/* Formative assessment disclaimer */}
      <div className="flex gap-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-4 mb-5">
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Formative assessment — not a diagnosis.</span> These insights are generated from limited journal data and should start conversations, not define your child. Every child&apos;s potential is unique and evolving.
        </p>
      </div>

      {/* CSS Grid: 2 columns on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 1 — Multiple Intelligences (spans 2 cols) */}
        <GlassCard className="md:col-span-2">
          <div className="p-5">
            <h3 className="font-bold text-slate-900 mb-0.5">Multiple Intelligences</h3>
            <p className="text-xs text-slate-500 mb-3">Gardner&apos;s 8-intelligence profile from lesson patterns</p>
            <div className="md:flex md:items-center md:gap-6">
              <IntelRadar scores={intelScores} />
              <div className="grid grid-cols-4 md:grid-cols-2 gap-2 mt-3 md:mt-0 md:flex-1">
                {INTELLIGENCES.map(intel => (
                  <div key={intel} className="text-center bg-white/50 rounded-xl p-2">
                    <div className="text-sm font-bold text-slate-800">{intelScores[intel]}</div>
                    <div className="text-[9px] text-slate-400 leading-tight">
                      {intel === 'Bodily-Kinesthetic' ? 'Kinesthetic'
                        : intel === 'Logical-Math' ? 'Logical'
                        : intel === 'Visual-Spatial' ? 'Visual'
                        : intel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 2 — Career Pathway (spans 2 cols, 3-in-a-row inside) */}
        <GlassCard className="md:col-span-2">
          <div className="p-5">
            <h3 className="font-bold text-slate-900 mb-3">Career Pathway Signals</h3>
            <div className="grid grid-cols-3 gap-3">
              {topHolland.map(([type, _], rank) => {
                const config = CAREER_PATHS[type]
                return (
                  <div key={type} className="bg-white/60 rounded-2xl overflow-hidden border border-white/50">
                    <div className="h-1" style={{ background: config.color }} />
                    <div className="p-3">
                      <div className="text-2xl mb-1.5">{config.emoji}</div>
                      <div className="text-xs font-bold text-slate-800 leading-tight mb-1">{config.title}</div>
                      <div className="space-y-0.5">
                        {config.careers.map(c => (
                          <div key={c} className="text-[10px] text-slate-500">{c}</div>
                        ))}
                      </div>
                      {rank === 0 && (
                        <div className="mt-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block"
                          style={{ background: config.bg, color: config.color }}>
                          Top match
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </GlassCard>

        {/* 3 — VARK */}
        <GlassCard>
          <div className="p-5">
            <h3 className="font-bold text-slate-900 mb-0.5">VARK Learning Style</h3>
            <p className="text-xs text-slate-500 mb-4">How your child best absorbs new information</p>
            <div className="space-y-3">
              {varkKeys.map(k => (
                <div key={k} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 w-20 shrink-0">{k}</span>
                  <div className="flex-1 bg-slate-100/80 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${vark[k]}%`, background: varkColors[k] }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right">{vark[k]}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 4 — PERMA */}
        <GlassCard>
          <div className="p-5">
            <h3 className="font-bold text-slate-900 mb-0.5">Emotional Wellbeing</h3>
            <p className="text-xs text-slate-500 mb-4">Seligman&apos;s PERMA model from journal patterns</p>
            <div className="flex justify-between">
              {permaConfig.map(({ key, label, color }) => (
                <PERMACircle key={key} value={perma[key]} label={label} color={color} />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 5 — Cognitive Growth (wide) */}
        <GlassCard className="md:col-span-2">
          <div className="p-5">
            <h3 className="font-bold text-slate-900 mb-0.5">Cognitive Growth</h3>
            <p className="text-xs text-slate-500 mb-4">Average Bloom&apos;s level per week (1=Remember → 5=Evaluate)</p>
            {growth.length >= 2 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={growth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: 'none' }}
                    formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Bloom level']}
                  />
                  <Line type="monotone" dataKey="level" stroke="#6366f1" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Need at least 2 weeks of data</p>
            )}
          </div>
        </GlassCard>

        {/* 6 — Subject Mastery Prediction (Ebbinghaus) — wide */}
        <GlassCard className="md:col-span-2">
          <div className="p-5">
            <h3 className="font-bold text-slate-900 mb-0.5">Subject Mastery Prediction</h3>
            <p className="text-xs text-slate-500 mb-4">Ebbinghaus learning curve — tracking retention trajectory per subject</p>
            <div className="space-y-3">
              {SUBJECTS.map(sub => {
                const m = mastery[sub]
                if (m.avg === 0) return null
                const pct = Math.round((m.avg / 5) * 100)
                const color = SUBJECT_COLORS[sub]
                return (
                  <div key={sub} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700 w-24 shrink-0">{sub}</span>
                    <div className="flex-1 bg-slate-100/80 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-8 text-right">{pct}%</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${masteryColor(m.status)}`}>
                      {m.status === 'on track' && m.weekOn
                        ? `On track → Wk ${m.weekOn}`
                        : masteryLabel(m.status)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </GlassCard>

        {/* 7 — Big Five OCEAN */}
        <GlassCard className="md:col-span-2">
          <div className="p-5">
            <h3 className="font-bold text-slate-900 mb-0.5">Personality Profile</h3>
            <p className="text-xs text-slate-500 mb-4">Big Five OCEAN model — inferred from learning patterns</p>
            <div className="space-y-3">
              {oceanConfig.map(({ key, color, desc }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{key}</span>
                    <span className="text-xs font-bold text-slate-600">{ocean[key]}</span>
                  </div>
                  <div className="bg-slate-100/80 rounded-full h-2.5 overflow-hidden mb-0.5">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ocean[key]}%`, background: color }} />
                  </div>
                  <p className="text-[10px] text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 8 — Vygotsky ZPD */}
        <GlassCard>
          <div className="p-5">
            <h3 className="font-bold text-slate-900 mb-0.5">Zone of Proximal Development</h3>
            <p className="text-xs text-slate-500 mb-4">Vygotsky ZPD — next learning step per subject</p>
            <div className="space-y-3">
              {SUBJECTS.map(sub => {
                const z = zpd[sub]
                const color = SUBJECT_COLORS[sub]
                return (
                  <div key={sub} className="bg-white/50 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color }}>{sub}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">{BLOOM_LABELS[z.current]}</span>
                        <span className="text-[10px] text-slate-400">→</span>
                        <span className="text-[10px] font-semibold text-slate-700">{BLOOM_LABELS[z.target]}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{z.activity}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </GlassCard>

        {/* 9 + 10 — Piaget & Erikson */}
        <div className="flex flex-col gap-4">
          {/* 9 — Piaget Stage */}
          <GlassCard>
            <div className="p-5">
              <h3 className="font-bold text-slate-900 mb-0.5">Cognitive Stage</h3>
              <p className="text-xs text-slate-500 mb-3">Piaget&apos;s developmental stage based on age ({childAge} yrs)</p>
              <div className="rounded-2xl p-4" style={{ background: `${piaget.color}15` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: piaget.color }} />
                  <span className="text-sm font-bold" style={{ color: piaget.color }}>{piaget.stage}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{piaget.desc}</p>
              </div>
            </div>
          </GlassCard>

          {/* 10 — Erikson Psychosocial */}
          <GlassCard>
            <div className="p-5">
              <h3 className="font-bold text-slate-900 mb-0.5">Psychosocial Development</h3>
              <p className="text-xs text-slate-500 mb-3">Erikson&apos;s stage based on age & emotional patterns</p>
              <div className="rounded-2xl p-4" style={{ background: `${erikson.color}12` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: erikson.color }} />
                  <span className="text-xs font-bold" style={{ color: erikson.color }}>{erikson.stage}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{erikson.alert}</p>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  )
}
