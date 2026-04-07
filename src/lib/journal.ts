export interface JournalEntry {
  date: string // YYYY-MM-DD
  timestamp: number
  cognitiveLevel: number // 1-5
  emotion: string // 'Curious' | 'Excited' | 'Disengaged' | 'Anxious' | 'Happy'
  subject: string // 'Maths' | 'Science' | 'English' | 'HSIE' | 'Creative Arts' | 'PE'
  timeSpent: number // 0-120 mins
  notes: string
}

const STORAGE_KEY = 'learnbridge_journal'

export function getJournalEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as JournalEntry[]
  } catch {
    return []
  }
}

export function saveJournalEntry(entry: JournalEntry): void {
  const entries = getJournalEntries()
  const idx = entries.findIndex(e => e.date === entry.date)
  const updated =
    idx >= 0
      ? entries.map((e, i) => (i === idx ? entry : e))
      : [...entries, entry]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function getStreakCount(entries: JournalEntry[]): number {
  const dates = new Set(entries.map(e => e.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (dates.has(dateStr)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function getEntriesForMonth(
  entries: JournalEntry[],
  year: number,
  month: number // 0-indexed
): JournalEntry[] {
  return entries.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
}

export function getEntriesLast30Days(entries: JournalEntry[]): JournalEntry[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  return entries.filter(e => e.date >= cutoffStr)
}

// ─── Multi-subject day journal (new format) ──────────────────────────────────

const DAY_JOURNAL_KEY = 'learnbridge_day_journal'
const DAY_NOTE_KEY    = 'learnbridge_day_notes'

export interface SubjectEntry {
  date: string
  subject: string
  timestamp: number
  cognitiveLevel: number // 1-5
  emotion: string
  timeSpent: number // 0-120 mins
  notes: string
  isHistorical?: boolean
}

function loadDayJournal(): SubjectEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(DAY_JOURNAL_KEY) || '[]') as SubjectEntry[]
  } catch {
    return []
  }
}

export function getDayEntries(date: string): SubjectEntry[] {
  return loadDayJournal().filter(e => e.date === date)
}

export function saveSubjectEntry(entry: SubjectEntry): void {
  const all = loadDayJournal()
  const idx = all.findIndex(e => e.date === entry.date && e.subject === entry.subject)
  const updated = idx >= 0 ? all.map((e, i) => (i === idx ? entry : e)) : [...all, entry]
  localStorage.setItem(DAY_JOURNAL_KEY, JSON.stringify(updated))
  // Also mirror into the legacy store so Progress/Insights pages see the data
  const legacy: JournalEntry = {
    date: entry.date,
    timestamp: entry.timestamp,
    cognitiveLevel: entry.cognitiveLevel,
    emotion: entry.emotion,
    subject: entry.subject,
    timeSpent: entry.timeSpent,
    notes: entry.notes,
  }
  saveJournalEntry(legacy)
}

export function getAllSubjectEntries(): SubjectEntry[] {
  return loadDayJournal()
}

export function saveDayNote(date: string, note: string): void {
  if (typeof window === 'undefined') return
  const notes: Record<string, string> = JSON.parse(localStorage.getItem(DAY_NOTE_KEY) || '{}')
  notes[date] = note
  localStorage.setItem(DAY_NOTE_KEY, JSON.stringify(notes))
}

export function getDayNote(date: string): string {
  if (typeof window === 'undefined') return ''
  try {
    const notes: Record<string, string> = JSON.parse(localStorage.getItem(DAY_NOTE_KEY) || '{}')
    return notes[date] ?? ''
  } catch {
    return ''
  }
}
