import type { SubjectEntry } from './journal'

// ─── Australian School Term Dates ────────────────────────────────────────────

const SCHOOL_TERMS = [
  { start: '2025-01-28', end: '2025-04-11' }, // 2025 Term 1
  { start: '2025-04-28', end: '2025-07-04' }, // 2025 Term 2
  { start: '2025-07-21', end: '2025-09-26' }, // 2025 Term 3
  { start: '2025-10-13', end: '2025-12-19' }, // 2025 Term 4
  { start: '2026-01-29', end: '2026-04-07' }, // 2026 Term 1 (up to today)
]

// ─── Weekly Schedule (matches mockTimetable pattern) ─────────────────────────
// 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri

const WEEKLY_SUBJECTS: Record<number, string[]> = {
  0: ['Maths', 'English', 'PE'],
  1: ['Science', 'HSIE', 'Maths', 'Creative Arts'],
  2: ['English', 'Maths', 'Science'],
  3: ['HSIE', 'English', 'PE', 'Creative Arts'],
  4: ['Maths', 'Science', 'English'],
}

// ─── Notes Pools (parent-perspective, first-person child observations) ────────

const NOTES: Record<string, string[]> = {
  Maths: [
    'Came home excited about fractions — explained the whole lesson at dinner.',
    'Had some trouble with long division today, spent extra time on practice.',
    'Breezed through multiplication tables — really proud of the improvement.',
    'Worked independently on the problem set for 40 minutes without help.',
    'Got a bit frustrated but kept trying — great persistence shown.',
    'Quick to finish today and taught a concept back to me clearly.',
    'Mentioned the lesson was hard but interesting — great attitude.',
    'Reviewed mistakes from last time and corrected them all independently.',
    'Very focused during homework — no distractions needed.',
    'Asked me to quiz them on times tables before dinner — motivated!',
  ],
  Science: [
    'Came home buzzing about the experiment — described every detail.',
    'Drew a really detailed diagram of the life cycle in their notebook.',
    'Was excited to show me what they learned about forces and gravity.',
    'Talked about the weather unit at length — clearly engaged.',
    'Had some trouble with the hypothesis writing but kept working on it.',
    'Did extra reading about the topic tonight — wonderful curiosity.',
    'Explained the states of matter using the kitchen as examples!',
    'Brought home the lab book — observations were thorough and clear.',
    "Connected today's lesson to a nature documentary we watched last week.",
    'Mentioned wanting to do a science fair project — great enthusiasm.',
  ],
  English: [
    'Read two chapters tonight without being asked — amazing progress.',
    'Worked on the story for over an hour — loved the creative outlet.',
    'Had some difficulty finding the right words but pushed through.',
    'Recited a poem from memory — had clearly practised at school.',
    'Spelling improved noticeably — the practice list is working.',
    'Spoke confidently about the class discussion topic at dinner.',
    'Finished the comprehension questions quickly and accurately.',
    'Asked for help with punctuation — reviewed it together.',
    'Writing is becoming more descriptive and imaginative each week.',
    'Read to younger sibling tonight — confidence in reading is growing.',
  ],
  HSIE: [
    "Told me all about Australia's history — very engaged with the topic.",
    'Found our suburb on the map and pointed out key features.',
    'Connected the lesson on cultural diversity to our family background.',
    'Had great questions about colonial history that we discussed at dinner.',
    'Needs a little more help understanding some concepts — extra reading helped.',
    'Did their own research online about the sustainability topic.',
    'Surprised me with how much they knew about democratic systems.',
    'Was curious about natural disasters — watched a documentary together.',
    'Talked confidently about the geography lesson and used proper terms.',
    'Connected current events to what they learnt in class — impressive!',
  ],
  'Creative Arts': [
    'Came home with a beautiful artwork — proudly showed everyone.',
    'Spent an hour recreating the technique at home with art supplies.',
    'Talked about the drama improvisation — had the whole family laughing.',
    'Was excited to show off the clay model — very proud of the result.',
    'Practised the rhythm activity by tapping on the table at home.',
    'Asked to use the computer to continue the digital art project.',
    'Sang the melody from music class during dinner — knows it well.',
    'Was a little tired from the performance prep but still very enthusiastic.',
    'Took creative risks in the project and it really paid off — stunning.',
    'Helped design a card for grandma using the new techniques learned.',
  ],
  PE: [
    'Still full of energy after school — clearly a fun PE day!',
    'Practised throwing technique in the backyard after school.',
    'Talked about the team game strategies — a natural tactical thinker.',
    'Was a bit sore from athletics but in great spirits about their PB.',
    'Did some stretching before bed from the gymnastics unit.',
    'Keen to go swimming on the weekend after the swim safety lesson.',
    'Played with friends outside for an extra hour after school.',
    "Shared tips from today's fitness session with the family.",
    'Working on catching technique — asked for some practice at home.',
    'Beamed about being picked to lead the warm-up today.',
  ],
}

// ─── Emotion pools ─────────────────────────────────────────────────────────────

const EMOTIONS_POSITIVE = ['Curious', 'Happy', 'Excited'] as const
const EMOTIONS_ALL = ['Curious', 'Happy', 'Excited', 'Anxious', 'Disengaged', 'Neutral'] as const

// ─── Deterministic helpers ────────────────────────────────────────────────────

function seededIndex(seed: number, length: number): number {
  return ((seed % length) + length) % length
}

function generateCognitiveLevel(daysSinceStart: number, subjectIndex: number): number {
  // Weighted toward 2-4; gradual improvement trend with some variation
  const base = 2 + ((daysSinceStart + subjectIndex * 7) % 3)
  const variation = (daysSinceStart * 3 + subjectIndex) % 2
  return Math.min(5, Math.max(1, base + variation - 1))
}

function generateEmotion(daysSinceStart: number, subjectIndex: number): string {
  // 60% positive, 40% neutral/negative
  const roll = (daysSinceStart * 7 + subjectIndex * 13) % 10
  if (roll < 6) {
    return EMOTIONS_POSITIVE[seededIndex(daysSinceStart + subjectIndex, EMOTIONS_POSITIVE.length)]
  }
  return EMOTIONS_ALL[seededIndex(daysSinceStart * 3 + subjectIndex, EMOTIONS_ALL.length)]
}

function generateTimeSpent(cognitiveLevel: number, daysSinceStart: number, subjectIndex: number): number {
  const base = 30 + cognitiveLevel * 8
  const variation = (daysSinceStart + subjectIndex * 5) % 20
  return Math.min(90, base + variation)
}

// ─── School day generator ─────────────────────────────────────────────────────

function isSchoolDay(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay() // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return false

  return SCHOOL_TERMS.some(term => dateStr >= term.start && dateStr <= term.end)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function dayOfWeekIndex(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay() // 0=Sun, 1=Mon ... 6=Sat
  return dow - 1 // 0=Mon, 1=Tue ... 4=Fri
}

// ─── Generate all historical entries ─────────────────────────────────────────

function generateHistoricalEntries(): SubjectEntry[] {
  const entries: SubjectEntry[] = []
  const startDate = '2025-01-01'
  const endDate = '2026-04-06'

  let currentDate = startDate
  let daysSinceStart = 0

  while (currentDate <= endDate) {
    if (isSchoolDay(currentDate)) {
      const dowIdx = dayOfWeekIndex(currentDate)
      const subjects = WEEKLY_SUBJECTS[dowIdx] ?? ['Maths', 'English', 'Science']

      subjects.forEach((subject, subjectIndex) => {
        const cognitiveLevel = generateCognitiveLevel(daysSinceStart, subjectIndex)
        const emotion = generateEmotion(daysSinceStart, subjectIndex)
        const timeSpent = generateTimeSpent(cognitiveLevel, daysSinceStart, subjectIndex)
        const notesPool = NOTES[subject] ?? NOTES['Maths']
        const notes = notesPool[seededIndex(daysSinceStart * 3 + subjectIndex, notesPool.length)]

        entries.push({
          date: currentDate,
          subject,
          timestamp: new Date(currentDate + 'T15:30:00').getTime(),
          cognitiveLevel,
          emotion,
          timeSpent,
          notes,
          isHistorical: true,
        })
      })

      daysSinceStart++
    }

    currentDate = addDays(currentDate, 1)
  }

  return entries
}

export const HISTORICAL_JOURNAL_ENTRIES: SubjectEntry[] = generateHistoricalEntries()

// Also export as legacy JournalEntry format for the old store
export interface LegacyEntry {
  date: string
  timestamp: number
  cognitiveLevel: number
  emotion: string
  subject: string
  timeSpent: number
  notes: string
}

export function getHistoricalLegacyEntries(): LegacyEntry[] {
  // Deduplicate: one entry per date (use last subject of the day)
  const byDate = new Map<string, LegacyEntry>()
  for (const e of HISTORICAL_JOURNAL_ENTRIES) {
    byDate.set(e.date, {
      date: e.date,
      timestamp: e.timestamp,
      cognitiveLevel: e.cognitiveLevel,
      emotion: e.emotion,
      subject: e.subject,
      timeSpent: e.timeSpent,
      notes: e.notes,
    })
  }
  return Array.from(byDate.values())
}
