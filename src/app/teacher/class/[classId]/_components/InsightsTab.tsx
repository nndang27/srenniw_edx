'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ResponsiveContainer,
} from 'recharts'
import { Search } from 'lucide-react'
import type { TeacherClass, Student } from '@/lib/mockTeacherData'
import { SUBJECTS } from '@/lib/mockTeacherData'
import PersonalityCard from '@/components/insights/PersonalityCard'

// ─── Constants ────────────────────────────────────────────────────────────────

// Keys match backend _INTEL_KEYS exactly
const INTELLIGENCES = [
  'Linguistic', 'Logical', 'Spatial', 'Kinesthetic',
  'Musical', 'Interpersonal', 'Intrapersonal', 'Naturalist',
] as const
type Intelligence = typeof INTELLIGENCES[number]

const SUBJECT_TO_MI: Record<string, Intelligence[]> = {
  English: ['Linguistic'],
  Maths: ['Logical'],
  Science: ['Logical', 'Naturalist'],
  'Creative Arts': ['Spatial', 'Musical'],
  PE: ['Kinesthetic', 'Interpersonal'],
  HSIE: ['Interpersonal', 'Intrapersonal'],
}

const MI_TIPS: Record<Intelligence, string> = {
  Linguistic: 'Incorporate storytelling, journaling, and verbal discussions.',
  Logical: 'Use puzzles, data analysis, and structured problem-solving tasks.',
  Spatial: 'Include diagrams, mind maps, and visual representations.',
  Kinesthetic: 'Add movement, hands-on experiments, and real-world tasks.',
  Musical: 'Integrate rhythm, songs, and audio patterns into lessons.',
  Interpersonal: 'Use cooperative learning, group projects, and peer teaching.',
  Intrapersonal: 'Provide reflection time, self-assessment, and personal goals.',
  Naturalist: 'Connect learning to the natural world through observation.',
}

const SUBJECT_COLORS: Record<string, string> = {
  Maths: '#3b82f6',
  Science: '#10b981',
  English: '#8b5cf6',
  HSIE: '#f59e0b',
  'Creative Arts': '#ec4899',
  PE: '#f97316',
}

const EMOTION_EMOJI: Record<string, string> = {
  Curious: '🤔', Excited: '🎉', Happy: '😊', Anxious: '😰', Disengaged: '😔',
  Proud: '😄', Tired: '😴', Frustrated: '😤', Neutral: '😐', Confident: '💪',
}

const VARK_COLORS: Record<string, string> = {
  Visual: '#3b82f6', Auditory: '#8b5cf6', Reading: '#10b981', Kinesthetic: '#f59e0b',
}
// Subject → VARK style weight
const VARK_SUBJECT_MAP: Record<string, string> = {
  'Creative Arts': 'Visual',
  PE: 'Kinesthetic',
  English: 'Reading',
  Maths: 'Reading',
  Science: 'Auditory',
  HSIE: 'Auditory',
}
const VARK_TIPS: Record<string, string> = {
  Visual: 'Use diagrams, colour-coding, and visual aids in lessons.',
  Auditory: 'Incorporate verbal explanations, discussions, and audio resources.',
  Reading: 'Provide written instructions, research tasks, and note-taking opportunities.',
  Kinesthetic: 'Use hands-on experiments, movement breaks, and manipulatives.',
}

const BLOOM_LABELS = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate']
const BASE_DATE = new Date().toISOString().split('T')[0]

// ─── Helpers ──────────────────────────────────────────────────────────────────

// MI: trung bình cognitive level của từng intelligence dựa trên subject mapping
// Nếu class chỉ có 1 subject, các intelligence còn lại lấy trung bình chung làm baseline
function computeMIScores(students: Student[]) {
  const allEntries = students.flatMap(s => s.journalEntries)
  const globalAvg = allEntries.length
    ? allEntries.reduce((a, e) => a + e.cognitiveLevel, 0) / allEntries.length
    : 3

  return INTELLIGENCES.map(intel => {
    const relevantSubjects = SUBJECTS.filter(s => SUBJECT_TO_MI[s]?.includes(intel))
    const entries = allEntries.filter(e => relevantSubjects.includes(e.subject as typeof SUBJECTS[number]))
    // Nếu không có entry cho intelligence này, dùng 80% global avg làm baseline
    const avg = entries.length ? entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length : globalAvg * 0.8
    return { subject: intel, value: Math.round(avg * 20), fullMark: 100 }
  })
}

// VARK: phân bổ dựa trên số lượng entry theo từng subject (không dùng cognitive để tránh lệch)
function computeVARK(students: Student[]) {
  const counts: Record<string, number> = { Visual: 0, Auditory: 0, Reading: 0, Kinesthetic: 0 }
  students.forEach(s => s.journalEntries.forEach(e => {
    const style = VARK_SUBJECT_MAP[e.subject]
    if (style) counts[style]++
  }))
  const total = Object.values(counts).reduce((a, x) => a + x, 0) || 1
  // Đảm bảo mỗi style có tối thiểu 5% để radar không trống
  const raw = Object.keys(counts).map(k => ({ name: k, raw: counts[k] / total }))
  const minShare = 0.05
  const adjusted = raw.map(x => ({ ...x, adj: Math.max(x.raw, minShare) }))
  const adjTotal = adjusted.reduce((a, x) => a + x.adj, 0)
  return adjusted.map(x => ({
    name: x.name,
    value: Math.round((x.adj / adjTotal) * 100),
    color: VARK_COLORS[x.name],
  }))
}

function computeGrowthVelocity(students: Student[], subject: string) {
  const today = new Date(BASE_DATE)
  const entries = students.flatMap(s => s.journalEntries.filter(e => e.subject === subject))
  const last7 = entries.filter(e => {
    const diff = (today.getTime() - new Date(e.date).getTime()) / 86400000
    return diff <= 7
  })
  const prev7 = entries.filter(e => {
    const diff = (today.getTime() - new Date(e.date).getTime()) / 86400000
    return diff > 7 && diff <= 14
  })
  const lastAvg = last7.length ? last7.reduce((a, e) => a + e.cognitiveLevel, 0) / last7.length : 0
  const prevAvg = prev7.length ? prev7.reduce((a, e) => a + e.cognitiveLevel, 0) / prev7.length : lastAvg
  return { velocity: +(lastAvg - prevAvg).toFixed(2) }
}

function velocityBadge(v: number) {
  if (v > 0.5) return { label: 'Fast Growth 🚀', color: 'bg-emerald-100 text-emerald-700' }
  if (v >= 0.1) return { label: 'Steady 📈', color: 'bg-blue-100 text-blue-700' }
  if (v >= -0.1) return { label: 'Stable', color: 'bg-slate-100 text-slate-600' }
  return { label: 'Needs Support ⚠️', color: 'bg-amber-100 text-amber-700' }
}

function buildDates14() {
  const today = new Date(BASE_DATE)
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().split('T')[0]
  })
}

// ─── Backend Insights types (matches /api/teacher/classes/{id}/insights) ─────

interface BackendInsights {
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
  personality: {
    traits: Record<string, number>
    superpower: string
    insight: string
    gentle_reminder?: string | null
  }
}

// ─── Shared Props ─────────────────────────────────────────────────────────────

interface Props {
  cls: TeacherClass
  subject: string
  backendInsights?: BackendInsights | null
}

// ─── Class View ───────────────────────────────────────────────────────────────

function ClassView({ cls, subject, backendInsights }: Props) {
  const displaySubjects = subject !== 'All' ? [subject] : [...SUBJECTS]
  const dates14 = useMemo(buildDates14, [])

  // Card 1 — Multiple Intelligences
  // Prefer backend-computed scores (uses time-decay + note_scores, matches parent side)
  // Fall back to local computation if backend insights not yet loaded
  const miScores = useMemo(() => {
    if (backendInsights?.intelligences?.radar_data) {
      const radar = backendInsights.intelligences.radar_data
      return INTELLIGENCES.map(intel => ({
        subject: intel,
        value: radar[intel] ?? 40,
        fullMark: 100,
      }))
    }
    return computeMIScores(cls.students)
  }, [backendInsights, cls.students])

  const top3MI = useMemo(() => [...miScores].sort((a, b) => b.value - a.value).slice(0, 3), [miScores])

  // Card 3 — Cognitive Growth (14-day line chart)
  const growthLineData = useMemo(() => dates14.map(date => {
    const point: Record<string, string | number> = {
      date: new Date(date).toLocaleDateString('en-AU', { month: 'numeric', day: 'numeric' }),
    }
    displaySubjects.forEach(subj => {
      const entries = cls.students.flatMap(s => s.journalEntries.filter(e => e.date === date && e.subject === subj))
      if (entries.length) point[subj] = +(entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length).toFixed(2)
    })
    return point
  }), [dates14, displaySubjects, cls.students])

  const growthVelocities = useMemo(() =>
    displaySubjects.map(subj => ({ subj, ...computeGrowthVelocity(cls.students, subj) })),
    [displaySubjects, cls.students]
  )

  // Card 4 — VARK
  // Prefer backend-computed distribution (uses time-decay + note_scores, matches parent side)
  const varkData = useMemo(() => {
    if (backendInsights?.vark?.vark_distribution) {
      const dist = backendInsights.vark.vark_distribution
      return Object.entries(dist).map(([name, value]) => ({
        name,
        value,
        color: VARK_COLORS[name] ?? '#94a3b8',
      }))
    }
    return computeVARK(cls.students)
  }, [backendInsights, cls.students])

  const dominantVARK = useMemo(() => [...varkData].sort((a, b) => b.value - a.value)[0], [varkData])

  // VARK tip: use backend suggestion if available
  const varkTip = backendInsights?.vark?.multimodal_suggestion ?? VARK_TIPS[dominantVARK?.name ?? 'Kinesthetic']

  return (
    <div className="space-y-5">
      <div className="text-[10px] text-slate-400 bg-slate-50/80 border border-slate-100 rounded-2xl px-4 py-2">
        📊 Insights are derived from journal entries using growth mindset indicators. Use as a starting point for conversations, not as definitive assessments.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Multiple Intelligences */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-0.5">🧠 Multiple Intelligences</h3>
          <p className="text-[10px] text-slate-400 mb-3">Class average across Gardner&apos;s 8 intelligences</p>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={miScores}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Radar name="Class" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Top Strengths</p>
            {top3MI.map((m, i) => (
              <div key={m.subject} className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{i + 1}. {m.subject}</span>
                <span className="text-xs font-bold text-blue-600">{m.value}/100</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 pt-1 leading-snug">
              💡 {MI_TIPS[top3MI[0]?.subject as Intelligence]}
            </p>
          </div>
        </div>

        {/* Card 2: Class Personality Distribution */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-0.5">🧬 Personality Profile</h3>
          <p className="text-[10px] text-slate-400 mb-4">
            Estimated trait distribution across {cls.students.length} students
          </p>
          {backendInsights?.personality ? (() => {
            const TRAIT_MAP = [
              { key: 'Openness',          label: 'Exploration & Creativity',    icon: '🎨', color: '#6366f1' },
              { key: 'Conscientiousness', label: 'Persistence & Responsibility', icon: '✅', color: '#22c55e' },
              { key: 'Extraversion',      label: 'Social Energy',               icon: '👥', color: '#f59e0b' },
              { key: 'Agreeableness',     label: 'Empathy & Cooperation',       icon: '💗', color: '#f43f5e' },
              { key: 'Neuroticism',       label: 'Emotional Sensitivity',       icon: '🧠', color: '#a855f7' },
            ]
            const traits = backendInsights.personality.traits ?? {}
            const total = Object.values(traits).reduce((a, v) => a + v, 0) || 1
            const n = cls.students.length

            const dominant = TRAIT_MAP.reduce((best, t) =>
              (traits[t.key] ?? 0) > (traits[best.key] ?? 0) ? t : best
            , TRAIT_MAP[0])

            const sorted = [...TRAIT_MAP].sort((a, b) => (traits[b.key] ?? 0) - (traits[a.key] ?? 0))

            return (
              <div className="space-y-4">
                {/* Dominant class trait badge */}
                <div className="flex items-center gap-3 rounded-xl p-3 border"
                  style={{ background: dominant.color + '12', borderColor: dominant.color + '40' }}>
                  <span className="text-2xl">{dominant.icon}</span>
                  <div>
                    <div className="text-[10px] text-slate-500">Dominant class trait</div>
                    <div className="text-sm font-bold" style={{ color: dominant.color }}>
                      {backendInsights.personality.superpower}
                    </div>
                  </div>
                </div>

                {/* Per-trait bars with student count estimate */}
                <div className="space-y-2.5">
                  {sorted.map(t => {
                    const val = traits[t.key] ?? 0
                    const studentCount = Math.max(1, Math.round((val / total) * n))
                    const isTop = t.key === dominant.key
                    return (
                      <div key={t.key} className="flex items-center gap-2.5">
                        <span className="text-sm shrink-0">{t.icon}</span>
                        <span className="text-[10px] font-semibold text-slate-600 w-28 shrink-0 truncate">{t.label}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${val}%`, background: t.color, opacity: isTop ? 1 : 0.5 }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{val}%</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                          style={{ background: t.color + '18', color: t.color }}>
                          ~{studentCount}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Insight */}
                {backendInsights.personality.insight && (
                  <p className="text-[10px] text-slate-400 leading-snug border-t border-slate-100 pt-3">
                    ✨ {backendInsights.personality.insight}
                  </p>
                )}
              </div>
            )
          })() : (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-slate-100 rounded-xl" />
              {[1,2,3,4,5].map(i => <div key={i} className="h-3 bg-slate-100 rounded" />)}
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Cognitive Growth */}
      <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-0.5">📈 Cognitive Growth</h3>
        <p className="text-[10px] text-slate-400 mb-4">Class average cognitive level per subject over the past 14 days</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={growthLineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={1} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
            {displaySubjects.map(subj => (
              <Line key={subj} type="monotone" dataKey={subj} stroke={SUBJECT_COLORS[subj]} strokeWidth={2} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {growthVelocities.map(({ subj, velocity }) => {
            const badge = velocityBadge(velocity)
            return (
              <div key={subj} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[subj] }} />
                <span className="text-[10px] text-slate-600 font-medium">{subj}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Card 4: VARK Distribution */}
      <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-0.5">🎯 VARK Learning Styles</h3>
        <p className="text-[10px] text-slate-400 mb-4">Estimated distribution based on subject engagement patterns</p>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={varkData} dataKey="value" innerRadius={42} outerRadius={72} paddingAngle={2}>
                {varkData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {[...varkData].sort((a, b) => b.value - a.value).map(v => (
              <div key={v.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                <span className="text-xs text-slate-700 font-medium w-24">{v.name}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${v.value}%`, backgroundColor: v.color }} />
                </div>
                <span className="text-xs font-bold text-slate-500">{v.value}%</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 pt-1 leading-snug">
              💡 {varkTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Individual View ──────────────────────────────────────────────────────────

function IndividualView({ cls, subject }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>(cls.students[0]?.id ?? '')
  const [teacherNote, setTeacherNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteToast, setNoteToast] = useState<string | null>(null)

  // Per-student backend insights (same pipeline as parent side)
  const [studentInsights, setStudentInsights] = useState<BackendInsights | null>(null)
  const [studentInsightsLoading, setStudentInsightsLoading] = useState(false)

  const filtered = useMemo(
    () => cls.students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [cls.students, search]
  )

  const student = cls.students.find(s => s.id === selectedId) ?? cls.students[0]
  const displaySubjects = subject !== 'All' ? [subject] : [...SUBJECTS]
  const dates14 = useMemo(buildDates14, [])

  // Fetch per-student insights whenever selected student changes
  useEffect(() => {
    if (!selectedId) return
    setStudentInsights(null)
    setStudentInsightsLoading(true)
    fetch(`/api/student-insights/${selectedId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.intelligences && data?.vark) setStudentInsights(data)
      })
      .catch(() => {})
      .finally(() => setStudentInsightsLoading(false))
  }, [selectedId])

  // Section 1 — MI: use per-student backend insights (identical to parent side)
  const miScores = useMemo(() => {
    if (studentInsights?.intelligences?.radar_data) {
      const radar = studentInsights.intelligences.radar_data
      return INTELLIGENCES.map(intel => ({
        subject: intel,
        value: radar[intel] ?? 40,
        fullMark: 100,
      }))
    }
    return computeMIScores([student])
  }, [studentInsights, student])

  const top2MI = useMemo(() => [...miScores].sort((a, b) => b.value - a.value).slice(0, 2), [miScores])

  // Section 2 — Personality Profile (backend)
  const allEntries = student.journalEntries

  // Section 3 — Cognitive Growth
  const cogLineData = useMemo(() => dates14.map(date => {
    const point: Record<string, string | number> = {
      date: new Date(date).toLocaleDateString('en-AU', { month: 'numeric', day: 'numeric' }),
    }
    displaySubjects.forEach(subj => {
      const entry = student.journalEntries.find(e => e.date === date && e.subject === subj)
      if (entry) point[subj] = entry.cognitiveLevel
    })
    return point
  }), [dates14, displaySubjects, student])

  const bloomCounts = BLOOM_LABELS.map((level, i) => ({
    level,
    count: student.journalEntries.filter(e => e.cognitiveLevel === i + 1).length,
  }))
  const maxBloom = Math.max(...bloomCounts.map(b => b.count), 1)

  const velocities = useMemo(() =>
    displaySubjects.map(subj => ({ subj, ...computeGrowthVelocity([student], subj) })),
    [displaySubjects, student]
  )

  const overallAvg = +(allEntries.reduce((a, e) => a + e.cognitiveLevel, 0) / (allEntries.length || 1)).toFixed(1)
  const zpdLevel = Math.min(5, Math.round(overallAvg) + 1)

  // Section 4 — VARK: use per-student backend insights
  const varkData = useMemo(() => {
    if (studentInsights?.vark?.vark_distribution) {
      const dist = studentInsights.vark.vark_distribution
      return Object.entries(dist).map(([name, value]) => ({
        name,
        value,
        color: VARK_COLORS[name] ?? '#94a3b8',
      }))
    }
    return computeVARK([student])
  }, [studentInsights, student])

  const dominantVARK = useMemo(() => [...varkData].sort((a, b) => b.value - a.value)[0], [varkData])
  const varkTip = studentInsights?.vark?.multimodal_suggestion ?? VARK_TIPS[dominantVARK?.name ?? 'Kinesthetic']

  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <div className="w-52 shrink-0 flex flex-col gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white/70 backdrop-blur-xl outline-none focus:border-blue-300"
          />
        </div>
        <div className="space-y-1 overflow-y-auto flex-1 max-h-[640px] [&::-webkit-scrollbar]:hidden">
          {filtered.map(s => {
            const last = s.journalEntries[0]?.emotion ?? 'Happy'
            const isSelected = s.id === selectedId
            return (
              <button
                key={s.id}
                onClick={() => { setSelectedId(s.id); setTeacherNote('') }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all
                  ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/60 hover:bg-white/80 text-slate-700'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full shrink-0" />
                <span className="text-xs font-medium truncate flex-1">{s.name}</span>
                <span className="text-sm">{EMOTION_EMOJI[last]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Student header */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-4 shadow-sm flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={student.avatar} alt={student.name} className="w-11 h-11 rounded-full ring-2 ring-blue-200" />
          <div className="flex-1">
            <p className="font-bold text-slate-800">{student.name}</p>
            <p className="text-[10px] text-slate-400">{allEntries.length} journal entries · Avg level {overallAvg}/5</p>
          </div>
          {studentInsightsLoading && (
            <div className="flex items-center gap-1.5 text-[10px] text-violet-500">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading insights…
            </div>
          )}
        </div>

        {/* Teacher Note */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-3">📝 Teacher Note</h4>
          <div className="space-y-2">
            <textarea
              value={teacherNote}
              onChange={e => setTeacherNote(e.target.value)}
              placeholder="Add a private observation note for this student..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white/80 outline-none focus:border-blue-300 resize-none"
            />
            <button
              disabled={noteSaving || !teacherNote.trim()}
              onClick={async () => {
                if (!teacherNote.trim() || noteSaving) return
                setNoteSaving(true)
                try {
                  const lastEntry = student.journalEntries[student.journalEntries.length - 1]
                  const date = lastEntry?.date ?? new Date().toISOString().split('T')[0]
                  const subjectForNote = lastEntry?.subject ?? (subject !== 'All' ? subject : 'General')
                  const res = await fetch('/api/teacher-diary-note', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      student_id: student.id,
                      date,
                      subject: subjectForNote,
                      teacher_note: teacherNote,
                    }),
                  })
                  if (!res.ok) throw new Error('Save failed')
                  setNoteToast('Note saved ✓')
                  setTimeout(() => setNoteToast(null), 2500)
                } catch {
                  setNoteToast('Failed to save')
                  setTimeout(() => setNoteToast(null), 2500)
                } finally {
                  setNoteSaving(false)
                }
              }}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
            >
              {noteSaving ? 'Saving…' : 'Save Note'}
            </button>
            {noteToast && (
              <p className={`text-[10px] font-semibold ${noteToast.includes('Failed') ? 'text-red-500' : 'text-emerald-600'}`}>
                {noteToast}
              </p>
            )}
          </div>
        </div>

        {/* Section 1: MI Radar */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-0.5">🧠 Multiple Intelligences</h4>
          <p className="text-[10px] text-slate-400 mb-3">Personal intelligence profile</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={miScores}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Radar name={student.name.split(' ')[0]} dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2">
            {top2MI.map(m => (
              <span key={m.subject} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                ★ {m.subject} ({m.value}/100)
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
            💡 {MI_TIPS[top2MI[0]?.subject as Intelligence]}
          </p>
        </div>

        {/* Section 2: Personality Profile */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          {studentInsights?.personality ? (
            <PersonalityCard data={studentInsights.personality} />
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          )}
        </div>

        {/* Section 3: Cognitive Growth */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-3">📈 Cognitive Growth</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={cogLineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={2} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
              {displaySubjects.map(subj => (
                <Line key={subj} type="monotone" dataKey={subj} stroke={SUBJECT_COLORS[subj]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Bloom&apos;s Distribution</p>
              <div className="space-y-1.5">
                {bloomCounts.map(({ level, count }) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 w-16 shrink-0">{level}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full" style={{ width: `${(count / maxBloom) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 w-3">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Growth Velocity</p>
                <div className="space-y-1.5">
                  {velocities.map(({ subj, velocity }) => {
                    const badge = velocityBadge(velocity)
                    return (
                      <div key={subj} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[subj] }} />
                        <span className="text-[9px] text-slate-500 flex-1 truncate">{subj}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">ZPD Recommendation</p>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Avg level <strong>{overallAvg}/5</strong> — extend to level <strong>{zpdLevel}</strong> tasks for optimal growth.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: VARK */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-3">🎯 VARK Learning Style</h4>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={varkData} layout="vertical" margin={{ top: 0, right: 40, left: 20, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {varkData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Dominant Style: </span>
            <span className="text-[10px] font-bold" style={{ color: dominantVARK?.color }}>
              {dominantVARK?.name} ({dominantVARK?.value}%)
            </span>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              💡 {varkTip}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function InsightsTab({ cls, subject }: Omit<Props, 'backendInsights'>) {
  const [view, setView] = useState<'class' | 'individual'>('class')
  const [backendInsights, setBackendInsights] = useState<BackendInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(true)

  useEffect(() => {
    if (!cls.id) return
    setInsightsLoading(true)
    fetch(`/api/class-insights/${cls.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.intelligences && data?.vark) setBackendInsights(data)
      })
      .catch(() => { /* fall through to local computation */ })
      .finally(() => setInsightsLoading(false))
  }, [cls.id])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('class')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            ${view === 'class' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
        >
          📊 Class View
        </button>
        <button
          onClick={() => setView('individual')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            ${view === 'individual' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
        >
          👤 Individual View
        </button>
        {insightsLoading && (
          <span className="text-[10px] text-slate-400 animate-pulse">Loading insights…</span>
        )}
        {!insightsLoading && backendInsights && (
          <span className="text-[10px] text-emerald-600 font-semibold">✓ Full AI insights</span>
        )}
      </div>

      {view === 'class'
        ? <ClassView cls={cls} subject={subject} backendInsights={backendInsights} />
        : <IndividualView cls={cls} subject={subject} backendInsights={backendInsights} />}
    </div>
  )
}
