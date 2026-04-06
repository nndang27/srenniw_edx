'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, Upload, Pencil, Calendar, List, CheckCircle, X, Save } from 'lucide-react'
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Topic</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Fractions and Decimals"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Learning Goal</label>
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
                    <input
                      value={topicVal}
                      onChange={e => setTopicVal(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-300"
                      placeholder="Topic"
                    />
                    <textarea
                      value={goalVal}
                      onChange={e => setGoalVal(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-300 resize-none"
                      placeholder="Learning goal"
                    />
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

export default function CurriculumTab({ classId, subject }: Props) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([CURRENT_WEEK]))
  const [toast, setToast] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [savedOverrides, setSavedOverrides] = useState<Record<string, Record<string, SavedEntry>>>({})

  const curricula = getCurriculum(classId, subject)

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
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
        >
          <Upload size={13} /> Upload Curriculum
        </button>
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
        <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
          <div className="grid grid-cols-5 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-100">
                {day}
              </div>
            ))}
            {SUBJECTS.slice(0, 5).map((subj, i) => {
              const weekItems = weekMap[CURRENT_WEEK] ?? []
              const item = weekItems.find(w => w.subject === subj)
              return (
                <div key={i} className={`rounded-xl p-2.5 min-h-[80px] border ${SUBJECT_COLORS[subj] ?? 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-bold mb-1">{subj}</p>
                  {item && <p className="text-[10px] leading-tight">{item.topic}</p>}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">Showing current term Week {CURRENT_WEEK}</p>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  )
}
