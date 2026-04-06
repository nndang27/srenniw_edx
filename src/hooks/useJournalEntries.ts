import { useState, useEffect } from 'react'
import { getJournalEntries, type JournalEntry } from '@/lib/journal'

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])

  useEffect(() => {
    setEntries(getJournalEntries())
  }, [])

  const refresh = () => setEntries(getJournalEntries())

  return { entries, refresh }
}
