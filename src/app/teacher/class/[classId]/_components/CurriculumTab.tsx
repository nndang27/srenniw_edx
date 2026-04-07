'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Calendar, List, CheckCircle, X, Save, Sparkles, Wifi, Radio } from 'lucide-react'
import { getCurriculum, SUBJECTS } from '@/lib/mockTeacherData'

const SUBJECT_COLORS: Record<string, string> = {
  Maths: 'bg-blue-100 text-blue-700 border-blue-200',
  Science: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  English: 'bg-violet-100 text-violet-700 border-violet-200',
  HSIE: 'bg-amber-100 text-amber-700 border-amber-200',
  'Creative Arts': 'bg-pink-100 text-pink-700 border-pink-200',
  PE: 'bg-orange-100 text-orange-700 border-orange-200',
}

const CURRENT_WEEK = 8
const TERM_WEEKS = 10

const AI_TOPICS: Record<string, string[]> = {
  Maths: ['Fractions and Equivalent Decimals', 'Place Value to Millions', 'Multiplication Strategies', 'Data and Statistics', 'Geometry: 2D Shapes'],
  Science: ['States of Matter', 'Forces and Motion', 'Living Things and Ecosystems', 'Earth and Space', 'Light and Sound'],
  English: ['Narrative Writing Techniques', 'Persuasive Texts', 'Reading Comprehension Strategies', 'Grammar and Punctuation', 'Poetry and Figurative Language'],
  HSIE: ['Australian Communities', 'Local Government', 'Cultural Diversity', 'Environment and Sustainability', 'Economics and Work'],
  'Creative Arts': ['Colour Theory and Mixing', 'Sculpture and 3D Art', 'Drama: Storytelling', 'Music Composition Basics', 'Digital Art'],
  PE: ['Team Sports Strategies', 'Athletics: Running Techniques', 'Swimming and Water Safety', 'Gymnastics Fundamentals', 'Yoga and Mindfulness'],
}

const AI_GOALS: Record<string, string> = {
  Maths: 'Students will be able to convert between fractions and decimals and apply these in real-world contexts.',
  Science: 'Students will identify and explain the properties of solids, liquids, and gases through hands-on investigation.',
  English: 'Students will plan and write a structured narrative using descriptive language and varied sentence structures.',
  HSIE: 'Students will analyse the roles of community groups and their contributions to local society.',
  'Creative Arts': 'Students will demonstrate understanding of colour relationships by creating a mixed-media artwork.',
  PE: 'Students will demonstrate correct technique and sportsmanship in team-based physical activities.',
}

const TIME_SLOTS = ['9:00–10:00', '10:30–11:30', '13:00–14:00', '14:15–15:00']

interface WeekItem { subject: string; topic: string; learningGoal: string }
interface SavedEntry { topic: string; learningGoal: string }

interface Props {
  classId: string
  subject: string
}

function UploadModal({ onClose, classId, onSaved }: { onClose: () => void; classId: string; onSaved: () => void }) {
  const [week, setWeek] = useState('1')
  const [subject, setSubject] = useState<string>(SUBJECTS[0])
  const [topic, setTopic] = useState('')
  const [goal, setGoal] = useState('')
  const [generatingTopic, setGeneratingTopic] = useState(false)
  const [generatingGoal, setGeneratingGoal] = useState(false)

  const aiGenerateTopic = () => {
    setGeneratingTopic(true)
    const options = AI_TOPICS[subject] ?? AI_TOPICS.Maths
    const target = options[Math.floor(Math.random() * options.length)]
    let i = 0
    setTopic('')
    const iv = setInterval(() => {
      i += 2
      setTopic(target.slice(0, i))
      if (i >= target.length) { clearInterval(iv); setTopic(target); setGeneratingTopic(false) }
    }, 20)
  }

  const aiGenerateGoal = () => {
    setGeneratingGoal(true)
    const target = AI_GOALS[subject] ?? AI_GOALS.Maths
    let i = 0
    setGoal('')
    const iv = setInterval(() => {
      i += 2
      setGoal(target.slice(0, i))
      if (i >= target.length) { clearInterval(iv); setGoal(target); setGeneratingGoal(false) }
    }, 15)
  }

  const handleSave = () => {
    if (!topic.trim()) return
    const key = `curriculum_${classId}_week_${week}`
    const existing: Record<string, SavedEntry> = JSON.parse(localStorage.getItem(key) ?? '{}')
    existing[subject] = { topic, learningGoal: goal }
    localStorage.setItem(key, JSON.stringify(existing))
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/90 border border-white/60 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800">Upload Curriculum Entry</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Week</label>
              <input
                type="number"
                min="1" max="20"
                value={week}
                onChange={e => setWeek(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 bg-white"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Topic</label>
              <button
                type="button"
                onClick={aiGenerateTopic}
                disabled={generatingTopic}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50"
              >
                <Sparkles size={9} /> {generatingTopic ? 'Generating…' : 'AI Generate'}
              </button>
            </div>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Fractions and Decimals"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Learning Goal</label>
              <button
                type="button"
                onClick={aiGenerateGoal}
                disabled={generatingGoal}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50"
              >
                <Sparkles size={9} /> {generatingGoal ? 'Generating…' : 'AI Generate'}
              </button>
            </div>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Students will be able to…"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!topic.trim()}
            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  )
}

function WeekEditor({
  week, items, classId, onSaved,
}: { week: number; items: WeekItem[]; classId: string; onSaved: (subj: string, topic: string, goal: string) => void }) {
  const [editSubj, setEditSubj] = useState<string | null>(null)
  const [topicVal, setTopicVal] = useState('')
  const [goalVal, setGoalVal] = useState('')
  const [savedSubj, setSavedSubj] = useState<string | null>(null)
  const [generatingField, setGeneratingField] = useState<'topic' | 'goal' | null>(null)

  const aiGenerate = (field: 'topic' | 'goal', subj: string) => {
    setGeneratingField(field)
    if (field === 'topic') {
      const options = AI_TOPICS[subj] ?? AI_TOPICS.Maths
      const target = options[Math.floor(Math.random() * options.length)]
      let i = 0; setTopicVal('')
      const iv = setInterval(() => {
        i += 2; setTopicVal(target.slice(0, i))
        if (i >= target.length) { clearInterval(iv); setTopicVal(target); setGeneratingField(null) }
      }, 20)
    } else {
      const target = AI_GOALS[subj] ?? AI_GOALS.Maths
      let i = 0; setGoalVal('')
      const iv = setInterval(() => {
        i += 2; setGoalVal(target.slice(0, i))
        if (i >= target.length) { clearInterval(iv); setGoalVal(target); setGeneratingField(null) }
      }, 15)
    }
  }

  const startEdit = (item: WeekItem) => {
    setEditSubj(item.subject)
    setTopicVal(item.topic)
    setGoalVal(item.learningGoal)
  }

  const handleSave = (subj: string) => {
    const key = `curriculum_${classId}_week_${week}`
    const existing: Record<string, SavedEntry> = JSON.parse(localStorage.getItem(key) ?? '{}')
    existing[subj] = { topic: topicVal, learningGoal: goalVal }
    localStorage.setItem(key, JSON.stringify(existing))
    onSaved(subj, topicVal, goalVal)
    setSavedSubj(subj)
    setEditSubj(null)
    setTimeout(() => setSavedSubj(null), 2000)
  }

  return (
    <div className="px-5 pb-4 space-y-3 border-t border-slate-100">
      {items.map(({ subject: subj, topic, learningGoal }) => {
        const isEditing = editSubj === subj
        const justSaved = savedSubj === subj
        return (
          <div key={subj} className="pt-3">
            <div className="flex items-start gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${SUBJECT_COLORS[subj] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {subj}
              </span>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        value={topicVal}
                        onChange={e => setTopicVal(e.target.value)}
                        className="w-full px-3 py-1.5 pr-24 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-300"
                        placeholder="Topic"
                      />
                      <button
                        type="button"
                        onClick={() => aiGenerate('topic', subj)}
                        disabled={generatingField !== null}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50"
                      >
                        <Sparkles size={8} /> AI
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        value={goalVal}
                        onChange={e => setGoalVal(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-300 resize-none"
                        placeholder="Learning goal"
                      />
                      <button
                        type="button"
                        onClick={() => aiGenerate('goal', subj)}
                        disabled={generatingField !== null}
                        className="absolute right-2 top-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50"
                      >
                        <Sparkles size={8} /> AI
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(subj)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600"
                      >
                        <Save size={11} /> Save
                      </button>
                      <button
                        onClick={() => setEditSubj(null)}
                        className="px-3 py-1 text-xs font-semibold text-slate-500 rounded-lg hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{topic}</p>
                      <button
                        onClick={() => startEdit({ subject: subj, topic, learningGoal })}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 shrink-0"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                      <CheckCircle size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                      {learningGoal}
                    </p>
                    {justSaved && (
                      <p className="text-[10px] text-emerald-500 font-semibold mt-1">Saved ✓</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const LMS_PROVIDERS = ['Canvas', 'Google Classroom', 'Compass', 'Schoology', 'Microsoft Teams', 'Other']
const LMS_STEPS = ['Connecting to LMS…', 'Syncing curriculum data…', 'Finalising import…']

function LmsModal({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [provider, setProvider] = useState('')
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0) // 0=idle,1-3=loading,4=success

  const handleConnect = () => {
    if (!provider || !url.trim() || !key.trim()) return
    setStep(1)
    setTimeout(() => setStep(2), 1400)
    setTimeout(() => setStep(3), 2800)
    setTimeout(() => { setStep(4); onConnected() }, 4200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/90 border border-white/60 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wifi size={15} className="text-blue-500" />
            </div>
            <h2 className="font-bold text-slate-800">Connect to School LMS</h2>
          </div>
          {step < 1 && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={16} />
            </button>
          )}
        </div>

        {step === 4 ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="font-bold text-slate-800">Connected to {provider}!</p>
            <p className="text-xs text-slate-500">Curriculum data has been synced. Your timetable and topics are now up to date.</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : step >= 1 ? (
          <div className="py-6 space-y-5">
            {LMS_STEPS.map((label, i) => {
              const stepNum = i + 1
              const done = step > stepNum
              const active = step === stepNum
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                    ${done ? 'bg-emerald-500' : active ? 'bg-blue-500' : 'bg-slate-100'}`}>
                    {done
                      ? <CheckCircle size={16} className="text-white" />
                      : active
                        ? <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                        : <div className="w-3 h-3 rounded-full bg-slate-300" />
                    }
                  </div>
                  <span className={`text-sm font-medium ${done ? 'text-emerald-600' : active ? 'text-blue-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">LMS Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {LMS_PROVIDERS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors text-left
                      ${provider === p ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300'}`}
                  >
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center
                      ${provider === p ? 'border-blue-500' : 'border-slate-300'}`}>
                      {provider === p && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </div>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">School LMS URL</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="e.g. school.instructure.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">API Key / Access Token</label>
              <input
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="Paste your API key here"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!provider || !url.trim() || !key.trim()}
                className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Wifi size={14} /> Connect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CurriculumTab({ classId, subject }: Props) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([CURRENT_WEEK]))
  const [toast, setToast] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showLmsModal, setShowLmsModal] = useState(false)
  const [lmsConnected, setLmsConnected] = useState(false)
  const [calendarWeek, setCalendarWeek] = useState(CURRENT_WEEK)
  const [expandedCalDay, setExpandedCalDay] = useState<string | null>(null)
  const [savedOverrides, setSavedOverrides] = useState<Record<string, Record<string, SavedEntry>>>({})
  const [timetable, setTimetable] = useState<Record<string, any[]>>({})

  // Original fallback for curricula list (topics)
  const curricula = getCurriculum(classId, subject)

  useEffect(() => {
    fetch('/api/timetable')
      .then(r => r.json())
      .then(data => setTimetable(data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    // Load all saved overrides from localStorage
    const overrides: Record<string, Record<string, SavedEntry>> = {}
    for (let w = 1; w <= 20; w++) {
      const key = `curriculum_${classId}_week_${w}`
      const raw = localStorage.getItem(key)
      if (raw) {
        try { overrides[String(w)] = JSON.parse(raw) } catch { /* ignore */ }
      }
    }
    setSavedOverrides(overrides)
  }, [classId])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      next.has(week) ? next.delete(week) : next.add(week)
      return next
    })
  }

  const handleItemSaved = (week: number, subj: string, topic: string, goal: string) => {
    setSavedOverrides(prev => ({
      ...prev,
      [String(week)]: { ...(prev[String(week)] ?? {}), [subj]: { topic, learningGoal: goal } },
    }))
    showToast('Saved ✓')
  }

  // Build week → subjects map, applying saved overrides
  const weekMap: Record<number, WeekItem[]> = {}
  curricula.forEach(c => {
    c.weeklyTopics.forEach(wt => {
      if (!weekMap[wt.week]) weekMap[wt.week] = []
      const override = savedOverrides[String(wt.week)]?.[c.subject]
      weekMap[wt.week].push({
        subject: c.subject,
        topic: override?.topic ?? wt.topic,
        learningGoal: override?.learningGoal ?? wt.learningGoal,
      })
    })
  })
  const weeks = Object.keys(weekMap).map(Number).sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      {/* Actions row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${view === 'list' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
          >
            <List size={13} /> List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${view === 'calendar' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
          >
            <Calendar size={13} /> Calendar View
          </button>
        </div>
        <div className="flex items-center gap-2">
          {lmsConnected && (
            <button
              onClick={() => setShowLmsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-200 transition-colors"
            >
              <CheckCircle size={12} /> Synced · Re-sync
            </button>
          )}
          <button
            onClick={() => setShowLmsModal(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-full transition-colors shadow-sm
              ${lmsConnected ? 'bg-slate-400 hover:bg-slate-500' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            <Wifi size={13} /> {lmsConnected ? 'Connected' : 'Connect to School LMS'}
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-3">
          {weeks.map(week => {
            const isCurrentWeek = week === CURRENT_WEEK
            const isExpanded = expandedWeeks.has(week)
            const items = weekMap[week] ?? []

            return (
              <div
                key={week}
                className={`backdrop-blur-xl border rounded-2xl overflow-hidden transition-all shadow-sm
                  ${isCurrentWeek ? 'bg-blue-50/80 border-blue-200' : 'bg-white/70 border-white/60'}`}
              >
                <button
                  onClick={() => toggleWeek(week)}
                  className="w-full flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    {isCurrentWeek && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        This Week
                      </span>
                    )}
                    <span className="font-semibold text-sm text-slate-800">Week {week}</span>
                    <span className="text-xs text-slate-400">{items.length} topic{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <WeekEditor
                    week={week}
                    items={items}
                    classId={classId}
                    onSaved={(subj, topic, goal) => handleItemSaved(week, subj, topic, goal)}
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setCalendarWeek(w => Math.max(1, w - 1)); setExpandedCalDay(null) }}
              disabled={calendarWeek <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Week {calendarWeek}</span>
              {calendarWeek === CURRENT_WEEK && (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500 text-white px-2 py-0.5 rounded-full">This Week</span>
              )}
            </div>
            <button
              onClick={() => { setCalendarWeek(w => Math.min(TERM_WEEKS, w + 1)); setExpandedCalDay(null) }}
              disabled={calendarWeek >= TERM_WEEKS}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>

          {/* Term mini-map */}
          <div className="flex gap-1 px-1">
            {Array.from({ length: TERM_WEEKS }, (_, i) => i + 1).map(w => (
              <button
                key={w}
                onClick={() => { setCalendarWeek(w); setExpandedCalDay(null) }}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  w === calendarWeek ? 'bg-blue-500' : w === CURRENT_WEEK ? 'bg-blue-200' : 'bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Week ${w}`}
              />
            ))}
          </div>

          {/* Day grid */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm">
            <div className="grid grid-cols-5 gap-2 mb-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, dayIdx) => {
                const hdrDate = new Date('2026-02-16')
                hdrDate.setDate(hdrDate.getDate() + ((calendarWeek - 1) * 7) + dayIdx)
                const dayNum = hdrDate.getDate()
                return (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-400 pb-1.5 border-b border-slate-100">
                    <div>{day.slice(0, 3).toUpperCase()}</div>
                    <div className="text-[9px] font-normal text-slate-300">{dayNum}</div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, dayIdx) => {
                const calKey = `${calendarWeek}-${day}`
                const isExpanded = expandedCalDay === calKey
                
                // Week 8 = current week (Apr 6–10, 2026). Base Monday = 2026-02-16.
                const baseDate = new Date('2026-02-16')
                baseDate.setDate(baseDate.getDate() + ((calendarWeek - 1) * 7) + dayIdx)
                const dateStr = baseDate.toISOString().split('T')[0]
                
                // Fetch daily classes from actual shared timetable API
                let rawClasses = timetable[dateStr] || []
                if (subject !== 'All') {
                  rawClasses = rawClasses.filter((c: any) => c.subject === subject)
                }
                const daySubjects = rawClasses

                return (
                  <div key={day} className="flex flex-col gap-1">
                    {daySubjects.length > 0 ? (
                      daySubjects.map((item: any, slotIdx: number) => {
                        const colClass = SUBJECT_COLORS[item.subject] ?? 'bg-slate-50 border-slate-100 text-slate-600'
                        const timeSlot = item.time || TIME_SLOTS[slotIdx] || ''
                        return (
                          <button
                            key={item.subject + slotIdx}
                            onClick={() => setExpandedCalDay(isExpanded ? null : calKey)}
                            className={`rounded-xl p-2 border text-left w-full transition-all hover:scale-[1.02] ${colClass}`}
                          >
                            <p className="text-[10px] font-bold leading-tight">{item.subject}</p>
                            {timeSlot && <p className="text-[8px] leading-tight mt-0.5 opacity-60 font-medium">{timeSlot}</p>}
                            {!isExpanded && <p className="text-[9px] leading-tight mt-0.5 opacity-75 line-clamp-2">{item.topic}</p>}
                          </button>
                        )
                      })
                    ) : (
                      <div className="rounded-xl p-2 border border-dashed border-slate-200 min-h-[60px] flex items-center justify-center">
                        <span className="text-[9px] text-slate-300">—</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Expanded day detail */}
            {expandedCalDay && expandedCalDay.startsWith(`${calendarWeek}-`) && (() => {
              const expandedDay = expandedCalDay.split('-').slice(1).join('-')
              const dayIdx = ['Monday','Tuesday','Wednesday','Thursday','Friday'].indexOf(expandedDay)
              const baseDate = new Date('2026-02-16')
              baseDate.setDate(baseDate.getDate() + ((calendarWeek - 1) * 7) + dayIdx)
              const dateStr = baseDate.toISOString().split('T')[0]

              let rawClasses = timetable[dateStr] || []
              if (subject !== 'All') {
                rawClasses = rawClasses.filter((c: any) => c.subject === subject)
              }
              const daySubjects = rawClasses
              if (!daySubjects.length) return null
              
              return (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-600">{expandedDay} — Week {calendarWeek} Details</p>
                  {daySubjects.map((item: any, idx: number) => (
                    <div key={item.subject + idx} className={`rounded-xl p-3 border ${SUBJECT_COLORS[item.subject] ?? 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-xs font-bold">{item.subject}: {item.topic}</p>
                      <p className="text-[10px] mt-1 opacity-75 flex items-start gap-1">
                        <CheckCircle size={10} className="mt-0.5 shrink-0" />
                        {AI_GOALS[item.subject] || 'Students will understand and apply core concepts in this lesson.'}
                      </p>
                    </div>
                  ))}
                </div>
              )
            })()}

            <p className="text-[10px] text-slate-300 mt-3 text-center">
              Term · Week {calendarWeek} of {TERM_WEEKS} · Tap a subject to expand
            </p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          classId={classId}
          onClose={() => setShowUploadModal(false)}
          onSaved={() => showToast('✅ Curriculum entry saved!')}
        />
      )}

      {/* LMS Modal */}
      {showLmsModal && (
        <LmsModal
          onClose={() => setShowLmsModal(false)}
          onConnected={() => setLmsConnected(true)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  )
}
