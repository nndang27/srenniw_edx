'use client'
import { useState, useMemo } from 'react'
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

// ─── Constants ────────────────────────────────────────────────────────────────

const INTELLIGENCES = [
  'Linguistic', 'Logical', 'Spatial', 'Kinesthetic',
  'Musical', 'Interpersonal', 'Intrapersonal', 'Naturalistic',
] as const
type Intelligence = typeof INTELLIGENCES[number]

const SUBJECT_TO_MI: Record<string, Intelligence[]> = {
  English: ['Linguistic'],
  Maths: ['Logical'],
  Science: ['Logical', 'Naturalistic'],
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
  Naturalistic: 'Connect learning to the natural world through observation.',
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
}
const EMOTION_BG: Record<string, string> = {
  Curious: '#3b82f622', Excited: '#f59e0b22', Happy: '#10b98122',
  Anxious: '#ef444422', Disengaged: '#94a3b822',
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
const BASE_DATE = '2026-04-06'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeMIScores(students: Student[]) {
  return INTELLIGENCES.map(intel => {
    const relevantSubjects = SUBJECTS.filter(s => SUBJECT_TO_MI[s]?.includes(intel))
    const entries = students.flatMap(s =>
      s.journalEntries.filter(e => relevantSubjects.includes(e.subject as typeof SUBJECTS[number]))
    )
    const avg = entries.length ? entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length : 0
    return { subject: intel, value: Math.round(avg * 20), fullMark: 100 }
  })
}

function computeVARK(students: Student[]) {
  const totals: Record<string, number> = { Visual: 0, Auditory: 0, Reading: 0, Kinesthetic: 0 }
  const counts: Record<string, number> = { Visual: 0, Auditory: 0, Reading: 0, Kinesthetic: 0 }
  students.forEach(s => s.journalEntries.forEach(e => {
    const style = VARK_SUBJECT_MAP[e.subject]
    if (style) { totals[style] += e.cognitiveLevel; counts[style]++ }
  }))
  const avgs = Object.keys(totals).map(k => ({ name: k, raw: counts[k] ? totals[k] / counts[k] : 0 }))
  const sum = avgs.reduce((a, x) => a + x.raw, 0) || 1
  return avgs.map(x => ({ name: x.name, value: Math.round((x.raw / sum) * 100), color: VARK_COLORS[x.name] }))
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

function CircularProgress({ ratio, color }: { ratio: number; color: string }) {
  const r = 34
  const circ = 2 * Math.PI * r
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${circ * ratio} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
      />
    </svg>
  )
}

// ─── Shared Props ─────────────────────────────────────────────────────────────

interface Props {
  cls: TeacherClass
  subject: string
}

// ─── Class View ───────────────────────────────────────────────────────────────

function ClassView({ cls, subject }: Props) {
  const displaySubjects = subject !== 'All' ? [subject] : [...SUBJECTS]
  const dates14 = useMemo(buildDates14, [])

  // Card 1 — Multiple Intelligences
  const miScores = useMemo(() => computeMIScores(cls.students), [cls.students])
  const top3MI = useMemo(() => [...miScores].sort((a, b) => b.value - a.value).slice(0, 3), [miScores])

  // Card 2 — Emotional Wellbeing
  const allEntries = useMemo(() => cls.students.flatMap(s => s.journalEntries), [cls.students])
  const positivityRatio = allEntries.length
    ? allEntries.filter(e => ['Curious', 'Excited', 'Happy'].includes(e.emotion)).length / allEntries.length
    : 0
  const wellbeingColor = positivityRatio > 0.6 ? '#10b981' : positivityRatio >= 0.4 ? '#f59e0b' : '#ef4444'
  const wellbeingLabel = positivityRatio > 0.6 ? 'Positive' : positivityRatio >= 0.4 ? 'Mixed' : 'Concerning'

  const concerningStudents = useMemo(() => {
    const cutoff = new Date(BASE_DATE)
    cutoff.setDate(cutoff.getDate() - 7)
    return cls.students.filter(s => {
      const recent = s.journalEntries.filter(e => new Date(e.date) >= cutoff)
      return recent.filter(e => ['Anxious', 'Disengaged'].includes(e.emotion)).length >= 3
    }).slice(0, 4)
  }, [cls.students])

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
  const varkData = useMemo(() => computeVARK(cls.students), [cls.students])
  const dominantVARK = useMemo(() => [...varkData].sort((a, b) => b.value - a.value)[0], [varkData])

  return (
    <div className="space-y-5">


      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Multiple Intelligences */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-0.5">🧠 Multiple Intelligences</h3>

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

        {/* Card 2: Emotional Wellbeing */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-0.5">💚 Emotional Wellbeing</h3>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <CircularProgress ratio={positivityRatio} color={wellbeingColor} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold" style={{ color: wellbeingColor }}>
                  {Math.round(positivityRatio * 100)}%
                </span>
              </div>
            </div>
            <div className="flex-1">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-2"
                style={{ backgroundColor: wellbeingColor + '22', color: wellbeingColor }}>
                {wellbeingLabel}
              </span>
              <p className="text-[10px] text-slate-500 leading-snug">
                {positivityRatio > 0.6
                  ? 'Class is thriving emotionally. Keep celebrating effort and curiosity.'
                  : positivityRatio >= 0.4
                  ? 'Mixed emotional climate. Check in with disengaged students.'
                  : 'Several students need emotional support. Consider class-wide wellbeing activities.'}
              </p>
            </div>
          </div>
          {concerningStudents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-amber-600 mb-1.5">⚠️ Students needing attention</p>
              <div className="flex flex-wrap gap-1.5">
                {concerningStudents.map(s => (
                  <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                    {s.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Cognitive Growth */}
      <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-0.5">📈 Cognitive Growth</h3>

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
              💡 {VARK_TIPS[dominantVARK?.name ?? 'Kinesthetic']}
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

  const filtered = useMemo(
    () => cls.students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [cls.students, search]
  )

  const student = cls.students.find(s => s.id === selectedId) ?? cls.students[0]
  const displaySubjects = subject !== 'All' ? [subject] : [...SUBJECTS]
  const dates14 = useMemo(buildDates14, [])

  // Section 1 — MI
  const miScores = useMemo(() => computeMIScores([student]), [student])
  const top2MI = useMemo(() => [...miScores].sort((a, b) => b.value - a.value).slice(0, 2), [miScores])

  // Section 2 — Emotional Wellbeing
  const allEntries = student.journalEntries
  const positivityRatio = allEntries.length
    ? allEntries.filter(e => ['Curious', 'Excited', 'Happy'].includes(e.emotion)).length / allEntries.length
    : 0
  const wellbeingColor = positivityRatio > 0.6 ? '#10b981' : positivityRatio >= 0.4 ? '#f59e0b' : '#ef4444'
  const isConcerning = positivityRatio < 0.4

  const emotionDots = dates14.map(date => ({
    date,
    emotion: student.journalEntries.find(e => e.date === date)?.emotion ?? null,
  }))

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

  // Section 4 — VARK
  const varkData = useMemo(() => computeVARK([student]), [student])
  const dominantVARK = useMemo(() => [...varkData].sort((a, b) => b.value - a.value)[0], [varkData])

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
          <div>
            <p className="font-bold text-slate-800">{student.name}</p>
            <p className="text-[10px] text-slate-400">{allEntries.length} journal entries · Avg level {overallAvg}/5</p>
          </div>
        </div>

        {/* Section 1: MI Radar */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-0.5">🧠 Multiple Intelligences</h4>

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

        {/* Section 2: Emotional Wellbeing */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-3">💚 Emotional Wellbeing</h4>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <CircularProgress ratio={positivityRatio} color={wellbeingColor} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold" style={{ color: wellbeingColor }}>
                  {Math.round(positivityRatio * 100)}%
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-700 mb-1">Positivity Ratio</p>
              {isConcerning && (
                <div className="text-[10px] text-red-600 font-semibold bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl mb-2">
                  ⚠️ Emotional support may be needed
                </div>
              )}
              <p className="text-[10px] text-slate-400 leading-snug">
                {positivityRatio > 0.6
                  ? 'Thriving emotionally — curious, excited, and happy most sessions.'
                  : positivityRatio >= 0.4
                  ? 'Mixed emotions. Watch for patterns of anxiety or disengagement.'
                  : 'Frequently anxious or disengaged. Consider a 1:1 check-in conversation.'}
              </p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">14-Day Emotion Timeline</p>
          <div className="flex flex-wrap gap-1.5">
            {emotionDots.map(({ date, emotion }) => (
              <div
                key={date}
                title={emotion
                  ? `${new Date(date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}: ${emotion}`
                  : 'No entry'}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{
                  backgroundColor: emotion ? EMOTION_BG[emotion] : '#f8fafc',
                  border: emotion ? undefined : '1px dashed #e2e8f0',
                }}
              >
                {emotion ? EMOTION_EMOJI[emotion] : ''}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Teacher Note</label>
            <textarea
              value={teacherNote}
              onChange={e => setTeacherNote(e.target.value)}
              placeholder="Add a private note about this student's wellbeing..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white/80 outline-none focus:border-blue-300 resize-none"
            />
          </div>
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
              💡 {VARK_TIPS[dominantVARK?.name ?? 'Kinesthetic']}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function InsightsTab({ cls, subject }: Props) {
  const [view, setView] = useState<'class' | 'individual'>('class')

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
      </div>

      {view === 'class' ? <ClassView cls={cls} subject={subject} /> : <IndividualView cls={cls} subject={subject} />}
    </div>
  )
}
