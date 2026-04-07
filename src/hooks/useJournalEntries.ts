import { useState, useEffect } from 'react'
import { type JournalEntry } from '@/lib/journal'

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])

  const loadEntries = async () => {
    try {
      const res = await fetch('/api/insights')
      const data = await res.json()
      if (Array.isArray(data)) {
        const mapped = data.map((e: any) => ({
          date: e.date || new Date().toISOString().split('T')[0],
          subject: e.subject || 'Maths',
          timestamp: new Date(e.date || Date.now()).getTime(),
          cognitiveLevel: e.cognitiveLevel || 3,
          emotion: e.emotion || 'Curious',
          timeSpent: e.timeSpent || Math.floor(Math.random() * 40) + 20,
          notes: e.parent_note || e.teacher_note || ''
        }))
        setEntries(mapped)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [])

  return { entries, refresh: loadEntries }
}
