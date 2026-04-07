'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sunrise, BookOpen, Lightbulb, Gamepad2, BookMarked, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { SUBJECT_COLORS, SUBJECT_EMOJIS, type SubjectName, type DaySchedule } from '@/lib/mockTimetable'
import { getDayEntries, saveSubjectEntry, getDayNote, saveDayNote, type SubjectEntry } from '@/lib/journal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const COGNITIVE_LEVELS = [
  { id: 1, label: 'Aware',      desc: 'Knows about the topic' },
  { id: 2, label: 'Understands',desc: 'Can explain it' },
  { id: 3, label: 'Applies',    desc: 'Can use it to solve problems' },
  { id: 4, label: 'Analyses',   desc: 'Can compare and organise' },
  { id: 5, label: 'Creates',    desc: 'Can design new things with it' },
]

const EMOTIONS = [
  { id: 1, emoji: '🤔', label: 'Curious' },
  { id: 2, emoji: '😊', label: 'Excited' },
  { id: 3, emoji: '😴', label: 'Disengaged' },
  { id: 4, emoji: '😰', label: 'Anxious' },
  { id: 5, emoji: '😄', label: 'Happy' },
]

// UI Components

// ─── Before-School Card ───────────────────────────────────────────────────────
function BeforeSchoolSection({ schedule, activities }: { schedule: DaySchedule[], activities: any }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const previewPrompts = activities?.previewPrompts || {}


  return (
    <div className="space-y-3">
      {schedule.map(cls => {
        const color  = SUBJECT_COLORS[cls.subject as SubjectName] ?? '#94a3b8'
        const emoji  = SUBJECT_EMOJIS[cls.subject as SubjectName] ?? '📚'
        const isOpen = expanded === cls.subject
        return (
          <div key={cls.subject} className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-2xl shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setExpanded(isOpen ? null : cls.subject)}
              >
                <span className="text-xl">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color }}>{cls.subject}</span>
                    <span className="text-xs text-slate-400">{cls.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{cls.topic}</p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/40 pt-3">
                  <div className="rounded-xl p-3" style={{ background: `${color}12` }}>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Today&apos;s lesson</p>
                    <p className="text-sm text-slate-800">{cls.topic}</p>
                    <p className="text-xs text-slate-500 mt-1">Taught by {cls.teacher}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">💬 Question to ask before school</p>
                    <p className="text-sm text-amber-900 italic">&quot;{previewPrompts[cls.subject] ?? 'What are you looking forward to learning today?'}&quot;</p>
                  </div>
                </div>
              )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Journal Section ──────────────────────────────────────────────────────────
type JournalStep = 'select' | 'assess' | 'done'

interface SubjectState {
  level: number | null
  emotion: number | null
  timeSpent: number
  notes: string
  saved: boolean
}

function JournalSection({ date, schedule }: { date: string; schedule: DaySchedule[] }) {
  const [step, setStep] = useState<JournalStep>('select')
  const [selected, setSelected] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [subjectStates, setSubjectStates] = useState<Record<string, SubjectState>>({})
  const [dayNote, setDayNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [childName, setChildName] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('childProfile')
      if (raw) setChildName(JSON.parse(raw).name ?? '')
    } catch { /* ignore */ }
    setDayNote(getDayNote(date))
    const existingSync = getDayEntries(date)
    
    // Attempt load from localStorage first
    if (existingSync.length > 0) {
      applyEntries(existingSync)
    } else {
      // Fallback to fetch from 400-day dataset so past days aren't empty
      fetch('/api/insights')
        .then(r => r.json())
        .then(allData => {
          const mockEntries = allData.filter((e: any) => e.date === date && e.is_school_day)
          if (mockEntries.length > 0) {
             const transformed = mockEntries.map((m: any) => ({
               subject: m.subject,
               cognitiveLevel: m.cognitiveLevel,
               emotion: m.emotion,
               timeSpent: 30,
               notes: m.parent_note || ''
             }))
             applyEntries(transformed)
             // Set the overall day note based on the first entry's parent_note (since our mock uses parent_note loosely)
             if (mockEntries[0].parent_note && !getDayNote(date)) {
               setDayNote(mockEntries[0].parent_note)
             }
          }
        })
        .catch(console.error)
    }
  }, [date])

  const applyEntries = (entries: any[]) => {
      const states: Record<string, SubjectState> = {}
      for (const e of entries) {
        states[e.subject] = {
          level: e.cognitiveLevel,
          emotion: EMOTIONS.findIndex(em => em.label === e.emotion) + 1,
          timeSpent: e.timeSpent,
          notes: e.notes || '',
          saved: true,
        }
      }
      setSubjectStates(states)
      setSelected(entries.map(e => e.subject))
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const toggleSubject = (sub: string) => {
    setSelected(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    )
  }

  const updateState = (subject: string, patch: Partial<SubjectState>) =>
    setSubjectStates(prev => ({ ...prev, [subject]: { ...defaultState(), ...prev[subject], ...patch } }))

  function defaultState(): SubjectState {
    return { level: null, emotion: null, timeSpent: 30, notes: '', saved: false }
  }

  const currentSubject = selected[currentIdx]
  const currentState   = subjectStates[currentSubject] ?? defaultState()

  const saveCurrentSubject = () => {
    if (!currentState.level || !currentState.emotion) {
      showToast('Please select understanding level and mood.')
      return
    }
    const emotionLabel = EMOTIONS.find(e => e.id === currentState.emotion)?.label ?? ''
    saveSubjectEntry({
      date,
      subject: currentSubject,
      timestamp: Date.now(),
      cognitiveLevel: currentState.level,
      emotion: emotionLabel,
      timeSpent: currentState.timeSpent,
      notes: currentState.notes,
    })
    updateState(currentSubject, { saved: true })
    if (currentIdx < selected.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      setStep('done')
    }
  }

  const handleFinalSave = async () => {
    setIsSaving(true)
    saveDayNote(date, dayNote)
    setIsSaving(false)
    showToast('Journal saved! ✨')
    setStep('select')
  }

  if (step === 'select') {
    return (
      <div className="space-y-4">
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium">
            {toast}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-slate-800 mb-1">Which subjects did you cover today?</h3>
          <p className="text-xs text-slate-500 mb-3">Tap to select — you can log multiple subjects.</p>
          <div className="grid grid-cols-2 gap-2">
            {schedule.map(cls => {
              const color   = SUBJECT_COLORS[cls.subject as SubjectName] ?? '#94a3b8'
              const emoji   = SUBJECT_EMOJIS[cls.subject as SubjectName] ?? '📚'
              const isOn    = selected.includes(cls.subject)
              const isSaved = subjectStates[cls.subject]?.saved
              return (
                <button
                  key={cls.subject}
                  onClick={() => toggleSubject(cls.subject)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left
                    ${isOn ? 'shadow-sm scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  style={isOn ? { borderColor: color, background: `${color}10` } : {}}
                >
                  <span className="text-xl">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={isOn ? { color } : { color: '#475569' }}>{cls.subject}</p>
                    <p className="text-[10px] text-slate-400 truncate">{cls.topic}</p>
                  </div>
                  {isSaved && <Check size={14} className="text-emerald-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
        {selected.length > 0 && (
          <Button
            className="w-full h-12 font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
            onClick={() => { setCurrentIdx(0); setStep('assess') }}
          >
            Start Journalling ({selected.length} subject{selected.length > 1 ? 's' : ''})
          </Button>
        )}
      </div>
    )
  }

  if (step === 'assess') {
    const color = SUBJECT_COLORS[currentSubject as SubjectName] ?? '#446dd5'
    const emoji = SUBJECT_EMOJIS[currentSubject as SubjectName] ?? '📚'
    return (
      <div className="space-y-5">
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium">
            {toast}
          </div>
        )}
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {selected.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${i === currentIdx ? 'bg-brand-500' : i < currentIdx ? 'bg-brand-200' : 'bg-slate-100'}`} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-bold text-lg" style={{ color }}>{currentSubject}</p>
            <p className="text-xs text-slate-500">{currentIdx + 1} of {selected.length}</p>
          </div>
        </div>

        {/* Time spent */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-700">Time spent</p>
            <span className="text-sm font-bold" style={{ color }}>{currentState.timeSpent} min</span>
          </div>
          <input
            type="range" min={0} max={120} step={15} value={currentState.timeSpent}
            onChange={e => updateState(currentSubject, { timeSpent: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: color }}
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            {[0,30,60,90,120].map(v => <span key={v}>{v}m</span>)}
          </div>
        </div>

        {/* Understanding level */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Understanding Level</p>
          <div className="grid grid-cols-5 gap-1">
            {COGNITIVE_LEVELS.map(l => {
              const isActive = currentState.level === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => updateState(currentSubject, { level: l.id })}
                  className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all
                    ${isActive ? 'shadow-sm scale-105' : 'border-slate-100 bg-white'}`}
                  style={isActive ? { borderColor: color, background: `${color}15` } : {}}
                >
                  <span className="font-bold text-base" style={isActive ? { color } : { color: '#94a3b8' }}>{l.id}</span>
                  <span className="text-[9px] font-medium text-center leading-tight" style={isActive ? { color } : { color: '#94a3b8' }}>{l.label}</span>
                </button>
              )
            })}
          </div>
          {currentState.level && (
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              <span className="font-semibold" style={{ color }}>{COGNITIVE_LEVELS[currentState.level - 1].label}:</span>{' '}
              {COGNITIVE_LEVELS[currentState.level - 1].desc}
            </p>
          )}
        </div>

        {/* Mood */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Mood during this subject</p>
          <div className="flex justify-between">
            {EMOTIONS.map(em => {
              const isActive = currentState.emotion === em.id
              return (
                <button
                  key={em.id}
                  onClick={() => updateState(currentSubject, { emotion: em.id })}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all w-[58px]
                    ${isActive ? 'shadow-sm scale-105' : 'hover:bg-slate-50'}`}
                  style={isActive ? { background: `${color}10`, outline: `2px solid ${color}` } : {}}
                >
                  <span className="text-2xl">{em.emoji}</span>
                  <span className="text-[9px] font-medium mt-0.5" style={isActive ? { color } : { color: '#94a3b8' }}>{em.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Observations <span className="text-slate-400">(optional)</span></p>
          <Textarea
            placeholder={`Any observations about today in ${currentSubject}?`}
            className="resize-none h-20 bg-slate-50 border-slate-200 text-sm"
            value={currentState.notes}
            onChange={e => updateState(currentSubject, { notes: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
            Back
          </Button>
          <Button
            className="flex-2 flex-1 font-semibold text-white"
            style={{ background: color }}
            onClick={saveCurrentSubject}
          >
            {currentIdx < selected.length - 1 ? `Next: ${selected[currentIdx + 1]}` : 'Finish Subjects'}
          </Button>
        </div>
      </div>
    )
  }

  // step === 'done'
  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
        <Check size={18} className="text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-800">
          {selected.length} subject{selected.length > 1 ? 's' : ''} logged!
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">Overall observations for today</p>
        <p className="text-xs text-slate-500">Anything about {childName || 'your child'}&apos;s day overall?</p>
        <Textarea
          placeholder="E.g. Had a great day, seemed really engaged with science..."
          className="resize-none h-24 bg-slate-50 border-slate-200"
          value={dayNote}
          onChange={e => setDayNote(e.target.value)}
        />
      </div>
      <Button
        className="w-full h-12 font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
        onClick={handleFinalSave}
        disabled={isSaving}
      >
        💾 Save Today&apos;s Journal
      </Button>
    </div>
  )
}

// ─── Activities Section ───────────────────────────────────────────────────────
function ActivitiesSection({ schedule, activitiesMock }: { schedule: DaySchedule[], activitiesMock: any }) {
  const subjects = [...new Set(schedule.map(s => s.subject))]
  return (
    <div className="space-y-4">
      {subjects.map(sub => {
        const activities = activitiesMock?.suggestions?.[sub] ?? []
        const color = SUBJECT_COLORS[sub as SubjectName] ?? '#94a3b8'
        return (
          <div key={sub}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>{sub}</p>
            <div className="space-y-2">
              {activities.map((act: any) => (
                <div key={act.title} className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-2xl shadow-sm p-3 flex gap-3">
                    <span className="text-2xl shrink-0">{act.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{act.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{act.desc}</p>
                    </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Play Section (mini quiz) ─────────────────────────────────────────────────
function PlaySection({ schedule, activitiesMock }: { schedule: DaySchedule[], activitiesMock: any }) {
  const subjects = [...new Set(schedule.map(s => s.subject))]
  const allQ = subjects.flatMap(s => (activitiesMock?.playQuestions?.[s] ?? []).map((q: any) => ({ ...q, subject: s })))
  const [qi, setQi]       = useState(0)
  const [answered, setAnswered] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone]   = useState(false)

  const q = allQ[qi]
  if (!q || allQ.length === 0) return (
    <div className="text-center py-10 text-slate-400 text-sm">No quiz available for today&apos;s subjects.</div>
  )

  if (done) return (
    <div className="text-center py-10 space-y-4">
      <p className="text-4xl">🎉</p>
      <p className="text-xl font-bold text-slate-800">Quiz Complete!</p>
      <p className="text-slate-600">Score: <span className="font-bold text-brand-600">{score}/{allQ.length}</span></p>
      <Button onClick={() => { setQi(0); setAnswered(null); setScore(0); setDone(false) }} variant="outline">
        Play Again
      </Button>
    </div>
  )

  const color = SUBJECT_COLORS[q.subject as SubjectName] ?? '#446dd5'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Question {qi + 1} of {allQ.length}</span>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: `${color}15`, color }}>
          {q.subject}
        </span>
      </div>
      <p className="text-base font-semibold text-slate-800">{q.q}</p>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt: any, i: number) => {
          const isCorrect = i === q.answer
          const isSelected = answered === i
          return (
            <button
              key={i}
              onClick={() => {
                if (answered !== null) return
                setAnswered(i)
                if (isCorrect) setScore(s => s + 1)
              }}
              className={`p-3 rounded-xl text-sm font-medium border-2 text-left transition-all
                ${answered !== null && isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                  : answered !== null && isSelected && !isCorrect ? 'border-red-300 bg-red-50 text-red-700'
                  : answered === null ? 'border-slate-200 bg-white hover:border-slate-300'
                  : 'border-slate-100 bg-white text-slate-400'}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {answered !== null && (
        <Button
          className="w-full font-semibold text-white"
          style={{ background: color }}
          onClick={() => {
            if (qi + 1 < allQ.length) { setQi(qi + 1); setAnswered(null) }
            else setDone(true)
          }}
        >
          {qi + 1 < allQ.length ? 'Next Question' : 'See Results'}
        </Button>
      )}
    </div>
  )
}

// ─── Digest Section (static mock) ────────────────────────────────────────────
function DigestSection({ schedule }: { schedule: DaySchedule[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">A summary of today&apos;s learning curriculum.</p>
      {schedule.map(cls => {
        const color = SUBJECT_COLORS[cls.subject as SubjectName] ?? '#94a3b8'
        const emoji = SUBJECT_EMOJIS[cls.subject as SubjectName] ?? '📚'
        return (
          <div key={cls.subject} className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{emoji}</span>
                <span className="font-semibold text-sm" style={{ color }}>{cls.subject}</span>
                <span className="text-xs text-slate-400">— {cls.teacher}</span>
              </div>
              <p className="text-sm font-medium text-slate-800 mb-1">{cls.topic}</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Students will be exploring <strong>{cls.topic}</strong> today. This lesson builds on previous knowledge
                and introduces new concepts that parents can reinforce at home through conversation and hands-on activities.
              </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const AFTER_TABS = [
  { id: 'digest',     label: 'Digest',     icon: BookOpen },
  { id: 'journal',   label: 'Journal',    icon: BookMarked },
  { id: 'activities',label: 'Activities', icon: Lightbulb },
  { id: 'play',      label: 'Play',       icon: Gamepad2 },
] as const

type AfterTab = typeof AFTER_TABS[number]['id']

export default function DayDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AfterTab>('digest')
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [activities, setActivities] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/timetable').then(r => r.json()),
      fetch('/api/activities').then(r => r.json())
    ])
    .then(([t, a]) => {
      setSchedule(t[date] || [])
      setActivities(a)
    })
    .catch(console.error)
    .finally(() => setLoading(false))
  }, [date])

  const formattedDate = (() => {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  })()

  const hasClasses = schedule.length > 0

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-5 bg-gradient-to-b from-blue-50/20 to-transparent min-h-screen">
      {/* Back + Date header */}
      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={() => router.push('/parent/calendar')}
          className="p-2 rounded-xl hover:bg-white/80 backdrop-blur-sm text-slate-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{formattedDate}</h2>
          <p className="text-xs text-slate-500">{hasClasses ? `${schedule.length} subjects scheduled` : 'No classes today'}</p>
        </div>
      </div>

      {!hasClasses ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🌴</p>
          <p className="text-slate-600 font-medium">No school today</p>
          <p className="text-sm text-slate-400">Enjoy the break!</p>
        </div>
      ) : (
        <>
          {/* Section A: Before School */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sunrise size={16} className="text-amber-500" />
              <h3 className="font-bold text-slate-800">Before School</h3>
            </div>
              <BeforeSchoolSection schedule={schedule} activities={activities} />
          </section>

          {/* Section B: After School tabs */}
          <section className="space-y-3">
            <h3 className="font-bold text-slate-800">After School</h3>

            {/* Tab bar */}
            <div className="flex backdrop-blur-xl bg-white/60 border border-white/50 rounded-2xl p-1 gap-1">
              {AFTER_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl flex-1 justify-center transition-all
                    ${activeTab === id
                      ? 'bg-white text-[#446dd5] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="pt-1">
              {activeTab === 'digest'      && <DigestSection schedule={schedule} />}
              {activeTab === 'journal'     && <JournalSection date={date} schedule={schedule} />}
              {activeTab === 'activities'  && <ActivitiesSection schedule={schedule} activitiesMock={activities} />}
              {activeTab === 'play'        && <PlaySection schedule={schedule} activitiesMock={activities} />}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
