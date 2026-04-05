'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sunrise, BookOpen, Lightbulb, Gamepad2, BookMarked, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { getScheduleForDate, SUBJECT_COLORS, SUBJECT_EMOJIS, type SubjectName, type DaySchedule } from '@/lib/mockTimetable'
import { getDayEntries, saveSubjectEntry, getDayNote, saveDayNote, type SubjectEntry } from '@/lib/journal'
import { Card, CardContent } from '@/components/ui/card'
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

const ACTIVITY_SUGGESTIONS: Record<string, { title: string; desc: string; emoji: string }[]> = {
  'Maths': [
    { emoji: '🎲', title: 'Fraction War Card Game', desc: 'Use a deck of cards to create fractions. Highest fraction wins the round.' },
    { emoji: '🛒', title: 'Supermarket Maths', desc: 'Let them calculate totals and change during the next grocery run.' },
    { emoji: '📏', title: 'Measure the House', desc: 'Estimate then measure furniture — compare metric and informal units.' },
  ],
  'Science': [
    { emoji: '🌱', title: 'Kitchen Garden Experiment', desc: 'Grow beans in a jar — observe roots and shoots forming over days.' },
    { emoji: '🧊', title: 'States of Matter Kitchen Lab', desc: 'Observe ice melting and water boiling — record observations together.' },
    { emoji: '🔦', title: 'Shadow Tracing', desc: 'Trace shadows hourly to understand how the sun moves.' },
  ],
  'English': [
    { emoji: '✍️', title: 'Story Starter Jar', desc: 'Write prompts on paper, pull one out, write for 10 minutes.' },
    { emoji: '📰', title: 'Family Newspaper', desc: 'Write a short article about something that happened this week.' },
    { emoji: '🎙️', title: 'Persuasion Challenge', desc: 'Give them 2 mins to convince you of something — then discuss.' },
  ],
  'HSIE': [
    { emoji: '🗺️', title: 'Map Your Neighbourhood', desc: 'Draw a map of your local area with landmarks.' },
    { emoji: '📸', title: 'Community Photo Walk', desc: 'Photograph things that show community roles (post box, park, school).' },
    { emoji: '🌍', title: 'Country Research Box', desc: 'Pick a country and find 5 interesting facts together.' },
  ],
  'Creative Arts': [
    { emoji: '🖌️', title: 'Watercolour Wash Sunset', desc: 'Practice blending colours to create a gradient sky.' },
    { emoji: '🎵', title: 'Rhythm Clapping Game', desc: 'Clap patterns and challenge each other to repeat them.' },
    { emoji: '🎭', title: 'Mini Play', desc: 'Act out a favourite story scene — swap roles.' },
  ],
  'PE': [
    { emoji: '⏱️', title: 'Backyard Obstacle Course', desc: 'Set up a timed course with hula hoops, cones, and jumps.' },
    { emoji: '🎯', title: 'Target Throwing', desc: 'Throw beanbags at chalk circles — record accuracy.' },
    { emoji: '🚴', title: 'Bike Ride Challenge', desc: 'Set a distance goal and track it on a map app.' },
  ],
}

const PLAY_QUESTIONS: Record<string, { q: string; options: string[]; answer: number }[]> = {
  'Maths': [
    { q: 'What is 3/4 of 20?', options: ['12', '15', '10', '8'], answer: 1 },
    { q: 'Which is bigger: 0.75 or 3/4?', options: ['0.75', '3/4', 'They are equal', 'Cannot tell'], answer: 2 },
  ],
  'Science': [
    { q: 'Water changing from liquid to gas is called?', options: ['Freezing', 'Condensation', 'Evaporation', 'Melting'], answer: 2 },
    { q: 'Which organism makes its own food from sunlight?', options: ['Lion', 'Mushroom', 'Plant', 'Fish'], answer: 2 },
  ],
  'English': [
    { q: 'Which word is an adjective?', options: ['Run', 'Quickly', 'Beautiful', 'Jump'], answer: 2 },
    { q: 'A piece of writing that tries to convince is called…?', options: ['Narrative', 'Persuasive', 'Descriptive', 'Report'], answer: 1 },
  ],
  'HSIE': [
    { q: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], answer: 2 },
    { q: 'Who makes laws in Australia?', options: ['The Police', 'Parliament', 'The Queen', 'Schools'], answer: 1 },
  ],
  'Creative Arts': [
    { q: 'Red + Blue = ?', options: ['Orange', 'Green', 'Purple', 'Brown'], answer: 2 },
    { q: 'What is a melody?', options: ['A beat pattern', 'A tune of notes', 'A type of dance', 'A painting style'], answer: 1 },
  ],
  'PE': [
    { q: 'How many players in a basketball team on court?', options: ['4', '5', '6', '7'], answer: 1 },
    { q: 'Which muscle group do squats primarily work?', options: ['Arms', 'Chest', 'Legs', 'Back'], answer: 2 },
  ],
}

// ─── Before-School Card ───────────────────────────────────────────────────────
function BeforeSchoolSection({ schedule }: { schedule: DaySchedule[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const previewPrompts: Record<string, string> = {
    'Maths':         'Do you know what we use fractions for in real life?',
    'Science':       'Can you name one thing that changes from solid to liquid?',
    'English':       'What makes a piece of writing convincing to you?',
    'HSIE':          'What do you know about how our local community works?',
    'Creative Arts': 'What colours do you think make a painting look peaceful?',
    'PE':            "How do you think you can improve your team's speed?",
  }

  return (
    <div className="space-y-3">
      {schedule.map(cls => {
        const color  = SUBJECT_COLORS[cls.subject as SubjectName] ?? '#94a3b8'
        const emoji  = SUBJECT_EMOJIS[cls.subject as SubjectName] ?? '📚'
        const isOpen = expanded === cls.subject
        return (
          <Card key={cls.subject} className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
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
                <div className="px-4 pb-4 space-y-3 border-t border-[#f0f0f0] pt-3">
                  <div className="rounded-lg p-3" style={{ background: `${color}12` }}>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Today&apos;s lesson</p>
                    <p className="text-sm text-slate-800">{cls.topic}</p>
                    <p className="text-xs text-slate-500 mt-1">Taught by {cls.teacher}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">💬 Question to ask before school</p>
                    <p className="text-sm text-amber-900 italic">&quot;{previewPrompts[cls.subject] ?? 'What are you looking forward to learning today?'}&quot;</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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

  useEffect(() => {
    setDayNote(getDayNote(date))
    const existing = getDayEntries(date)
    if (existing.length > 0) {
      const states: Record<string, SubjectState> = {}
      for (const e of existing) {
        states[e.subject] = {
          level: e.cognitiveLevel,
          emotion: EMOTIONS.findIndex(em => em.label === e.emotion) + 1,
          timeSpent: e.timeSpent,
          notes: e.notes,
          saved: true,
        }
      }
      setSubjectStates(states)
      setSelected(existing.map(e => e.subject))
    }
  }, [date])

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
        <p className="text-xs text-slate-500">Anything about Liam&apos;s day overall?</p>
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
function ActivitiesSection({ schedule }: { schedule: DaySchedule[] }) {
  const subjects = [...new Set(schedule.map(s => s.subject))]
  return (
    <div className="space-y-4">
      {subjects.map(sub => {
        const activities = ACTIVITY_SUGGESTIONS[sub] ?? []
        const color = SUBJECT_COLORS[sub as SubjectName] ?? '#94a3b8'
        return (
          <div key={sub}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>{sub}</p>
            <div className="space-y-2">
              {activities.map(act => (
                <Card key={act.title} className="border-none shadow-sm">
                  <CardContent className="p-3 flex gap-3">
                    <span className="text-2xl shrink-0">{act.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{act.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{act.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Play Section (mini quiz) ─────────────────────────────────────────────────
function PlaySection({ schedule }: { schedule: DaySchedule[] }) {
  const subjects = [...new Set(schedule.map(s => s.subject))]
  const allQ = subjects.flatMap(s => (PLAY_QUESTIONS[s] ?? []).map(q => ({ ...q, subject: s })))
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
        {q.options.map((opt, i) => {
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
          <Card key={cls.subject} className="border-none shadow-sm">
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
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

  const schedule = getScheduleForDate(date)

  const formattedDate = (() => {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  })()

  const hasClasses = schedule.length > 0

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-5">
      {/* Back + Date header */}
      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={() => router.push('/parent/calendar')}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
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
            <BeforeSchoolSection schedule={schedule} />
          </section>

          {/* Section B: After School tabs */}
          <section className="space-y-3">
            <h3 className="font-bold text-slate-800">After School</h3>

            {/* Tab bar */}
            <div className="flex border-b border-[#eeeeee] gap-0">
              {AFTER_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors
                    ${activeTab === id
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}`}
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
              {activeTab === 'activities'  && <ActivitiesSection schedule={schedule} />}
              {activeTab === 'play'        && <PlaySection schedule={schedule} />}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
