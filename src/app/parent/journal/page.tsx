'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Notification } from '@/types'

const COGNITIVE_LEVELS = [
  { id: 1, label: 'Aware', desc: 'Knows about the topic' },
  { id: 2, label: 'Understands', desc: 'Can explain it' },
  { id: 3, label: 'Applies', desc: 'Can use it to solve problems' },
  { id: 4, label: 'Analyses', desc: 'Can compare and organize' },
  { id: 5, label: 'Creates', desc: 'Can design new things with it' },
]

const EMOTIONS = [
  { id: 1, emoji: '🤔', label: 'Curious' },
  { id: 2, emoji: '😊', label: 'Excited' },
  { id: 3, emoji: '😴', label: 'Disengaged' },
  { id: 4, emoji: '😰', label: 'Anxious' },
  { id: 5, emoji: '😄', label: 'Happy' },
]

export default function JournalPage() {
  const api = useApi()
  const router = useRouter()
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [latestBriefId, setLatestBriefId] = useState<string | null>(null)

  useEffect(() => {
    api.getInbox()
      .then(({ items }) => {
        if (items[0]?.brief?.id) setLatestBriefId(items[0].brief.id)
      })
      .catch(console.error)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (selectedLevel === null || selectedEmotion === null) {
      showToast('Please select both understanding level and mood.')
      return
    }

    setIsSaving(true)
    try {
      const emotionLabel = EMOTIONS.find(e => e.id === selectedEmotion)?.label || ''
      const levelLabel = COGNITIVE_LEVELS.find(l => l.id === selectedLevel)?.label || ''
      const message = `Journal: Understanding=${levelLabel} (${selectedLevel}/5), Mood=${emotionLabel}${notes ? '. ' + notes : ''}`

      if (latestBriefId) {
        await api.submitFeedback(latestBriefId, message)
      } else {
        // Store locally if no brief yet
        localStorage.setItem('journal_entry', message)
      }

      showToast('Journal saved! ✨ Here are today\'s activity ideas.')
      setTimeout(() => router.push('/parent/action'), 1500)
    } catch (e) {
      console.error(e)
      showToast('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Today&apos;s Learning Journal</h2>
        <p className="text-lg text-slate-500">How did learning go today? Takes 30 seconds.</p>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-10">

          {/* Section 1: Cognitive Check-in */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Understanding Level</h3>
            <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
              <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-slate-100 z-0 hidden sm:block rounded-full" />
              {selectedLevel !== null && (
                <div
                  className="absolute top-6 left-[10%] h-1 bg-blue-500 z-0 hidden sm:block rounded-full transition-all duration-300"
                  style={{ width: `${((selectedLevel - 1) / 4) * 80}%` }}
                />
              )}
              {COGNITIVE_LEVELS.map(level => {
                const isActive = selectedLevel === level.id
                const isPast = selectedLevel !== null && level.id < selectedLevel
                return (
                  <div key={level.id} className="relative z-10 flex flex-col items-center">
                    <button
                      onClick={() => setSelectedLevel(level.id)}
                      data-testid={`level-${level.id}`}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-200 border-2
                        ${isActive ? 'bg-blue-500 border-blue-500 text-white scale-110 shadow-md'
                          : isPast ? 'bg-blue-50 border-blue-400 text-blue-500'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      {level.id}
                    </button>
                    <span className={`text-xs mt-3 font-medium text-center transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
                      {level.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="min-h-[40px] flex items-center justify-center bg-slate-50 rounded-lg p-3 border border-slate-100">
              {selectedLevel !== null ? (
                <p className="text-sm font-medium text-slate-700">
                  <span className="text-blue-500 font-bold mr-2">{COGNITIVE_LEVELS[selectedLevel - 1].label}:</span>
                  {COGNITIVE_LEVELS[selectedLevel - 1].desc}
                </p>
              ) : (
                <p className="text-sm text-slate-400">Select a level to see description</p>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Section 2: Emotional Observation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">How was the mood?</h3>
            <div className="flex justify-between sm:justify-center sm:gap-6">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion.id}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  data-testid={`emotion-${emotion.id}`}
                  className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 w-[60px] sm:w-[80px]
                    ${selectedEmotion === emotion.id ? 'bg-orange-50 ring-2 ring-orange-400 scale-105 shadow-sm' : 'hover:bg-slate-50'}`}
                >
                  <span className="text-3xl sm:text-4xl mb-2">{emotion.emoji}</span>
                  <span className={`text-xs font-medium ${selectedEmotion === emotion.id ? 'text-orange-600' : 'text-slate-500'}`}>
                    {emotion.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Section 3: Notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">Any observations? (Optional)</h3>
            <Textarea
              placeholder="E.g., She asked great questions about pizza fractions!"
              className="resize-none h-24 bg-slate-50 border-slate-200"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              data-testid="input-journal-notes"
            />
          </div>

          <Button
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all active:scale-[0.98]"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="button-save-journal"
          >
            {isSaving ? 'Saving...' : '💾 Save & Get Today\'s Ideas'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
