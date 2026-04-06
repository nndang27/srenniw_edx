export type Emotion = 'Curious' | 'Excited' | 'Disengaged' | 'Anxious' | 'Happy'
export type CognitiveLevel = 1 | 2 | 3 | 4 | 5

export interface JournalEntry {
  date: string
  subject: string
  cognitiveLevel: CognitiveLevel
  emotion: Emotion
  timeSpent: number
  notes: string
}

export interface Student {
  id: string
  name: string
  avatar: string
  journalEntries: JournalEntry[]
}

export interface TeacherClass {
  id: string
  name: string
  studentCount: number
  students: Student[]
}

export interface WeeklyTopic {
  week: number
  topic: string
  learningGoal: string
}

export interface ClassCurriculum {
  classId: string
  subject: string
  weeklyTopics: WeeklyTopic[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SUBJECTS = ['Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE'] as const
export type Subject = typeof SUBJECTS[number]

const BASE_DATE = '2026-04-06'

function dateOffset(daysAgo: number): string {
  const d = new Date(BASE_DATE)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

// ─── Notes Pool ───────────────────────────────────────────────────────────────

const NOTES: Record<string, string[]> = {
  Maths: [
    'Completed all practice problems independently',
    'Struggled with long division — needs extra practice',
    'Asked excellent questions about fractions',
    'Finished early and helped a classmate',
    'Made errors in subtraction with regrouping',
    'Strong mental arithmetic skills demonstrated',
    'Grasped multiplication tables quickly today',
    'Had difficulty following multi-step problems',
  ],
  Science: [
    'Very engaged with the hands-on experiment',
    'Wrote detailed observations in lab book',
    'Had trouble forming a hypothesis independently',
    'Connected lesson to real-world examples brilliantly',
    'Completed all activities well ahead of schedule',
    'Struggled to stay focused during the lesson',
    'Asked insightful questions about the topic',
    'Made accurate predictions before the experiment',
  ],
  English: [
    'Wrote a creative and detailed story',
    'Needs support with sentence punctuation',
    'Read ahead of the class and summarised well',
    'Participated actively in class discussion',
    'Had difficulty organising ideas in writing',
    'Showed great improvement in spelling today',
    'Excellent vocabulary choices in creative writing',
    'Comprehension answers showed deep understanding',
  ],
  HSIE: [
    "Showed curiosity about Australia's history",
    'Strong map reading and geography skills',
    'Needed prompting to stay on task',
    'Connected history to current events thoughtfully',
    'Contributed meaningfully to class discussion',
    'Completed research activity with minimal support',
    'Asked great questions about cultural diversity',
    'Made connections between past and present effectively',
  ],
  'Creative Arts': [
    'Produced a beautiful and original artwork',
    'Experimented confidently with new techniques',
    'Struggled with colour mixing but kept trying',
    'Showed great imagination in the design task',
    'Completed the project well ahead of time',
    'Required more structured guidance today',
    'Demonstrated excellent fine motor skills',
    'Took creative risks that paid off wonderfully',
  ],
  PE: [
    'Showed excellent teamwork in group activities',
    'Demonstrated strong coordination and agility',
    'Sat out briefly but rejoined with enthusiasm',
    'Led the warm-up with great energy',
    'Encouraged peers during the team game',
    'Worked on improving catching technique today',
    'Sprinted personal best in fitness testing',
    'Excellent sportsmanship throughout the lesson',
  ],
}

// ─── Data Generators ──────────────────────────────────────────────────────────

// profile: 0=high achiever, 1=struggling/at-risk, 2=improving, 3=average, 4=inconsistent
function getCognitiveLevel(profile: number, dayIndex: number, seed: number): CognitiveLevel {
  switch (profile) {
    case 0: {
      const levels: CognitiveLevel[] = [4, 5, 4, 5, 5, 4, 5, 4]
      return levels[(dayIndex + seed) % 8]
    }
    case 1: {
      // Declining in recent days
      if (dayIndex >= 10) return ([1, 1, 2] as CognitiveLevel[])[(dayIndex - 10 + seed) % 3]
      const pool: CognitiveLevel[] = [2, 3, 2, 3, 2, 1, 2]
      return pool[(dayIndex + seed) % 7]
    }
    case 2: {
      // Improving from 1→4 over 14 days
      return Math.max(1, Math.min(5, 1 + Math.floor((dayIndex + seed % 2) / 4))) as CognitiveLevel
    }
    case 3: {
      const pool: CognitiveLevel[] = [2, 3, 3, 4, 2, 3, 3, 2]
      return pool[(dayIndex + seed) % 8]
    }
    case 4: {
      const pool: CognitiveLevel[] = [2, 4, 1, 5, 3, 2, 4, 1, 3, 5]
      return pool[(dayIndex + seed + 2) % 10]
    }
    default: return 3
  }
}

function getEmotion(profile: number, dayIndex: number, seed: number): Emotion {
  switch (profile) {
    case 0: {
      const e: Emotion[] = ['Curious', 'Excited', 'Happy', 'Curious', 'Excited', 'Happy']
      return e[(dayIndex + seed) % 6]
    }
    case 1: {
      // Anxious/Disengaged in last 7 days → triggers "needs attention"
      if (dayIndex >= 7) {
        const recent: Emotion[] = ['Anxious', 'Disengaged', 'Anxious', 'Disengaged', 'Anxious', 'Curious', 'Disengaged']
        return recent[(dayIndex - 7) % 7]
      }
      const early: Emotion[] = ['Curious', 'Anxious', 'Happy', 'Disengaged', 'Curious']
      return early[(dayIndex + seed) % 5]
    }
    case 2: {
      // Starts anxious, ends happy/curious
      if (dayIndex >= 10) {
        const late: Emotion[] = ['Curious', 'Happy', 'Excited', 'Happy']
        return late[(dayIndex - 10 + seed) % 4]
      }
      if (dayIndex >= 5) {
        const mid: Emotion[] = ['Curious', 'Happy', 'Anxious', 'Curious', 'Happy']
        return mid[(dayIndex - 5 + seed) % 5]
      }
      const early: Emotion[] = ['Anxious', 'Disengaged', 'Anxious', 'Curious', 'Anxious']
      return early[(dayIndex + seed) % 5]
    }
    case 3: {
      const e: Emotion[] = ['Curious', 'Happy', 'Curious', 'Excited', 'Curious', 'Disengaged', 'Happy']
      return e[(dayIndex + seed) % 7]
    }
    case 4: {
      const e: Emotion[] = ['Excited', 'Disengaged', 'Curious', 'Happy', 'Anxious', 'Excited', 'Curious']
      return e[(dayIndex + seed + 2) % 7]
    }
    default: return 'Curious'
  }
}

function generateJournalEntries(studentIndex: number): JournalEntry[] {
  const profile = studentIndex % 5
  const seed = Math.floor(studentIndex / 5)
  const entries: JournalEntry[] = []

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const dayIndex = 13 - dayOffset
    const subject = SUBJECTS[dayIndex % SUBJECTS.length]
    const cognitiveLevel = getCognitiveLevel(profile, dayIndex, seed)
    const emotion = getEmotion(profile, dayIndex, seed)
    const timeSpent = 20 + cognitiveLevel * 4 + ((seed + dayIndex) % 12)
    const notesPool = NOTES[subject]
    const notes = notesPool[(dayIndex + seed + profile) % notesPool.length]

    entries.push({
      date: dateOffset(dayOffset),
      subject,
      cognitiveLevel,
      emotion,
      timeSpent,
      notes,
    })
  }
  return entries
}

// ─── Student Names ────────────────────────────────────────────────────────────

const CLASS_4A_NAMES = [
  'Olivia Chen', 'Liam Nguyen', 'Emma Wilson', 'Noah Rodriguez', 'Ava Patel',
  'Mason Kim', 'Sophia Brown', 'Ethan Davis', 'Isabella Martinez', 'Lucas Thompson',
  'Mia Garcia', 'Aiden Johnson', 'Charlotte Lee', 'James Taylor', 'Amelia Anderson',
  'Logan White', 'Harper Harris', 'Elijah Clark', 'Evelyn Lewis', 'Benjamin Robinson',
]

const CLASS_5B_NAMES = [
  'Emily Zhang', 'Lucas Smith', 'Grace Miller', 'Noah Wilson', 'Zoe Brown',
  'Ryan Davis', 'Lily Taylor', 'Oliver Jones', 'Sophie Johnson', 'William Lee',
  'Chloe Martin', 'James Thompson', 'Hannah Garcia', 'Jack Rodriguez', 'Ella Martinez',
  'Ethan White', 'Ava Harris', 'Mason Clark', 'Isabella Lewis', 'Liam Robinson',
]

const CLASS_6C_NAMES = [
  'Sarah Chen', 'Daniel Park', 'Julia Wang', 'Alex Johnson', 'Mia Thompson',
  'Ryan Kim', 'Chloe Davis', 'Nathan Wilson', 'Emma Rodriguez', 'Tyler Martinez',
  'Lily Patel', 'James Brown', 'Grace Lee', 'Mason Taylor', 'Ava Harris',
  'Ethan Garcia', 'Sophia White', 'Lucas Anderson', 'Isabella Clark', 'Noah Lewis',
]

const ALL_NAMES = [CLASS_4A_NAMES, CLASS_5B_NAMES, CLASS_6C_NAMES]

function buildStudents(names: string[], classPrefix: string): Student[] {
  return names.map((name, i) => ({
    id: `${classPrefix}-s${i + 1}`,
    name,
    avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(name)}&backgroundColor=dbeafe`,
    journalEntries: generateJournalEntries(i),
  }))
}

// ─── Classes ──────────────────────────────────────────────────────────────────

const CLASS_DEFS = [
  { id: '4a', name: 'Year 4A', names: CLASS_4A_NAMES },
  { id: '5b', name: 'Year 5B', names: CLASS_5B_NAMES },
  { id: '6c', name: 'Year 6C', names: CLASS_6C_NAMES },
]

export const MOCK_CLASSES: TeacherClass[] = CLASS_DEFS.map(({ id, name, names }) => ({
  id,
  name,
  studentCount: names.length,
  students: buildStudents(names, id),
}))

export function getClass(classId: string): TeacherClass | undefined {
  return MOCK_CLASSES.find(c => c.id === classId)
}

// ─── Curriculum ───────────────────────────────────────────────────────────────

const CURRICULUM_TOPICS: Record<string, Record<string, { topic: string; learningGoal: string }[]>> = {
  '4a': {
    Maths: [
      { topic: 'Place Value to 10,000', learningGoal: 'Read, write and order numbers to 10,000' },
      { topic: 'Addition and Subtraction Strategies', learningGoal: 'Apply mental and written strategies for computation' },
      { topic: 'Multiplication Tables (×6, ×7, ×8)', learningGoal: 'Recall multiplication facts fluently' },
      { topic: 'Long Division Basics', learningGoal: 'Use informal methods to divide two-digit numbers' },
      { topic: 'Fractions (Halves to Eighths)', learningGoal: 'Identify, model and compare simple fractions' },
      { topic: 'Decimals and Money', learningGoal: 'Connect decimals to fractions in real-world contexts' },
      { topic: 'Measurement: Length and Perimeter', learningGoal: 'Measure and calculate perimeter of rectangles' },
      { topic: 'Data and Graphs', learningGoal: 'Collect data and represent in column graphs and dot plots' },
      { topic: '2D and 3D Space', learningGoal: 'Identify and classify 2D shapes and 3D objects' },
      { topic: 'Time and Duration', learningGoal: 'Read and interpret time in 12- and 24-hour formats' },
    ],
    Science: [
      { topic: 'Living Things and Their Needs', learningGoal: 'Identify needs of plants and animals in different habitats' },
      { topic: 'Life Cycles', learningGoal: 'Compare life cycles of different organisms' },
      { topic: 'Forces — Push and Pull', learningGoal: 'Describe how forces affect the motion of objects' },
      { topic: 'Gravity and Friction', learningGoal: 'Explore how gravity and friction act on everyday objects' },
      { topic: 'States of Matter', learningGoal: 'Classify materials as solid, liquid or gas and explain changes' },
      { topic: 'Mixtures and Separation', learningGoal: 'Identify and separate simple mixtures' },
      { topic: "Earth's Surface and Resources", learningGoal: "Describe how Earth's surface features form and change" },
      { topic: 'Weather Patterns', learningGoal: 'Observe and explain patterns in daily and seasonal weather' },
      { topic: 'Sound and Vibration', learningGoal: 'Investigate how sounds are produced and travel' },
      { topic: 'Review and Science Fair', learningGoal: 'Apply scientific method to design and present a simple investigation' },
    ],
    English: [
      { topic: 'Narrative Writing — Character', learningGoal: 'Develop characters with distinct traits in short narratives' },
      { topic: 'Narrative Writing — Setting and Plot', learningGoal: 'Structure a story with orientation, complication and resolution' },
      { topic: 'Information Reports', learningGoal: 'Research and write a factual report using subheadings' },
      { topic: 'Persuasive Texts — Opinions', learningGoal: 'State and support a personal opinion with reasons and evidence' },
      { topic: 'Reading Comprehension Strategies', learningGoal: 'Use inferencing and predicting while reading texts' },
      { topic: 'Grammar — Nouns, Verbs, Adjectives', learningGoal: 'Identify and use word classes to improve writing' },
      { topic: 'Punctuation and Sentence Variety', learningGoal: 'Use commas, speech marks and varied sentence lengths' },
      { topic: 'Poetry — Rhyme and Rhythm', learningGoal: 'Explore and write poems using rhyme and rhythm' },
      { topic: 'Spelling Patterns and Rules', learningGoal: 'Apply spelling rules including prefixes and suffixes' },
      { topic: 'Speaking and Listening — Presentations', learningGoal: 'Prepare and deliver a short oral presentation to class' },
    ],
    HSIE: [
      { topic: "Australia's Communities", learningGoal: 'Describe features of local and national communities' },
      { topic: 'Our Environment', learningGoal: 'Investigate how people interact with and care for environments' },
      { topic: 'Cultural Diversity', learningGoal: 'Recognise and respect cultural practices in our community' },
      { topic: 'Maps and Geographical Features', learningGoal: 'Use maps to locate and describe geographical features' },
      { topic: "Australia's First Peoples", learningGoal: 'Explore the history and culture of Aboriginal and Torres Strait Islander peoples' },
      { topic: 'Colonial Australia', learningGoal: 'Understand European settlement and its impacts' },
      { topic: 'Democracy and Citizenship', learningGoal: 'Explain the role of laws and government in our community' },
      { topic: 'Economics — Needs vs Wants', learningGoal: 'Distinguish between needs and wants in household economics' },
      { topic: 'Natural Disasters', learningGoal: 'Describe causes and community responses to natural disasters' },
      { topic: 'Sustainability', learningGoal: 'Evaluate everyday choices for their environmental impact' },
    ],
    'Creative Arts': [
      { topic: 'Colour Theory and Mixing', learningGoal: 'Explore primary, secondary and tertiary colours through painting' },
      { topic: 'Line and Texture in Drawing', learningGoal: 'Use varied line weight and texture in observational drawing' },
      { topic: 'Printmaking', learningGoal: 'Create a simple print using everyday materials' },
      { topic: 'Sculpture with Clay', learningGoal: 'Form and decorate a small clay sculpture' },
      { topic: 'Drama — Character and Role Play', learningGoal: 'Explore character using voice and movement' },
      { topic: 'Drama — Improvisation', learningGoal: 'Develop improvisation skills through short scenarios' },
      { topic: 'Music — Rhythm and Beat', learningGoal: 'Clap, tap and play rhythmic patterns in simple time' },
      { topic: 'Music — Pitch and Melody', learningGoal: 'Sing and play simple melodies using graphic notation' },
      { topic: 'Digital Art Basics', learningGoal: 'Create a digital artwork using drawing tools' },
      { topic: 'Integrated Arts Showcase', learningGoal: 'Present an artwork combining visual, performance or digital elements' },
    ],
    PE: [
      { topic: 'Athletics — Running and Jumping', learningGoal: 'Develop sprinting technique and standing broad jump' },
      { topic: 'Athletics — Throwing', learningGoal: 'Practice overarm throw for accuracy and distance' },
      { topic: 'Team Games — Kicking Sports', learningGoal: 'Develop kicking and goal-scoring skills in modified games' },
      { topic: 'Team Games — Passing and Catching', learningGoal: 'Practise chest pass and catching in team activities' },
      { topic: 'Swimming — Water Safety', learningGoal: 'Demonstrate basic water safety and floating skills' },
      { topic: 'Swimming — Freestyle and Backstroke', learningGoal: 'Improve freestyle arm action and backstroke kick' },
      { topic: 'Gymnastics — Balance and Flexibility', learningGoal: 'Perform basic balances and stretches on floor and equipment' },
      { topic: 'Gymnastics — Travelling and Rolling', learningGoal: 'Execute forward rolls and travelling sequences' },
      { topic: 'Health — Food and Nutrition', learningGoal: 'Identify food groups and make healthy choices' },
      { topic: 'Health — Personal Safety', learningGoal: 'Recognise safe and unsafe situations and trusted adults' },
    ],
  },
}

// Reuse Year 4 topics with slight variation for 5B and 6C (adapted year level)
function adaptTopics(
  topics: { topic: string; learningGoal: string }[],
  yearLabel: string
): { topic: string; learningGoal: string }[] {
  return topics.map(t => ({
    topic: t.topic,
    learningGoal: t.learningGoal.replace('Year 4', yearLabel).replace('Year 5', yearLabel),
  }))
}

function buildCurriculum(classId: string): ClassCurriculum[] {
  const yearLabel = classId === '5b' ? 'Year 5' : classId === '6c' ? 'Year 6' : 'Year 4'
  const baseTopics = CURRICULUM_TOPICS['4a']

  return SUBJECTS.map(subject => ({
    classId,
    subject,
    weeklyTopics: (baseTopics[subject] ?? []).map((t, i) => ({
      week: i + 1,
      topic: classId === '4a' ? t.topic : `${t.topic} (${yearLabel})`,
      learningGoal: adaptTopics([t], yearLabel)[0].learningGoal,
    })),
  }))
}

export const MOCK_CURRICULUM: ClassCurriculum[] = [
  ...buildCurriculum('4a'),
  ...buildCurriculum('5b'),
  ...buildCurriculum('6c'),
]

export function getCurriculum(classId: string, subject?: string): ClassCurriculum[] {
  return MOCK_CURRICULUM.filter(
    c => c.classId === classId && (!subject || subject === 'All' || c.subject === subject)
  )
}

// ─── Derived Stats Helpers ────────────────────────────────────────────────────

export function avgCognitiveLevel(students: Student[], subject?: string): number {
  const entries = students.flatMap(s =>
    subject && subject !== 'All'
      ? s.journalEntries.filter(e => e.subject === subject)
      : s.journalEntries
  )
  if (!entries.length) return 0
  return +(entries.reduce((a, e) => a + e.cognitiveLevel, 0) / entries.length).toFixed(1)
}

export function dominantEmotion(students: Student[]): { emotion: Emotion; emoji: string } {
  const counts: Record<Emotion, number> = {
    Curious: 0, Excited: 0, Happy: 0, Anxious: 0, Disengaged: 0,
  }
  students.forEach(s => s.journalEntries.forEach(e => { counts[e.emotion]++ }))
  const dominant = (Object.entries(counts) as [Emotion, number][]).sort((a, b) => b[1] - a[1])[0][0]
  const emojiMap: Record<Emotion, string> = {
    Curious: '🤔', Excited: '🎉', Happy: '😊', Anxious: '😰', Disengaged: '😔',
  }
  return { emotion: dominant, emoji: emojiMap[dominant] }
}

export function studentsNeedingAttention(students: Student[]): {
  student: Student
  reason: string
  suggestion: string
}[] {
  const today = new Date(BASE_DATE)
  const sevenDaysAgo = new Date(BASE_DATE)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return students.flatMap(student => {
    const recentEntries = student.journalEntries.filter(e => new Date(e.date) >= sevenDaysAgo)
    const anxiousCount = recentEntries.filter(e => e.emotion === 'Anxious').length
    const disengagedCount = recentEntries.filter(e => e.emotion === 'Disengaged').length

    // Check declining cognitive level
    const sorted = [...student.journalEntries].sort((a, b) => a.date.localeCompare(b.date))
    const firstHalf = sorted.slice(0, 7)
    const secondHalf = sorted.slice(7)
    const firstAvg = firstHalf.reduce((a, e) => a + e.cognitiveLevel, 0) / (firstHalf.length || 1)
    const secondAvg = secondHalf.reduce((a, e) => a + e.cognitiveLevel, 0) / (secondHalf.length || 1)
    const declining = secondAvg < firstAvg - 0.8

    const alerts: { student: Student; reason: string; suggestion: string }[] = []

    if (anxiousCount >= 3) {
      alerts.push({
        student,
        reason: `Showed anxiety ${anxiousCount} times this week`,
        suggestion: 'Schedule a 1:1 check-in — ask about any concerns at home or in class',
      })
    } else if (disengagedCount >= 3) {
      alerts.push({
        student,
        reason: `Disengaged ${disengagedCount} sessions this week`,
        suggestion: 'Try a different activity format or partner work to re-engage',
      })
    } else if (declining) {
      alerts.push({
        student,
        reason: 'Cognitive engagement declining over past 7 days',
        suggestion: 'Review recent work and check for gaps in prior knowledge',
      })
    }

    return alerts
  })
}

export function topPerformers(students: Student[]): { student: Student; subject: string; change: number }[] {
  return students
    .map(student => {
      const bySubject: Record<string, { early: number[]; late: number[] }> = {}
      student.journalEntries.forEach((e, i) => {
        if (!bySubject[e.subject]) bySubject[e.subject] = { early: [], late: [] }
        if (i < 7) bySubject[e.subject].early.push(e.cognitiveLevel)
        else bySubject[e.subject].late.push(e.cognitiveLevel)
      })
      let bestSubject = ''
      let bestChange = -Infinity
      Object.entries(bySubject).forEach(([subj, { early, late }]) => {
        if (!early.length || !late.length) return
        const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length
        const lateAvg = late.reduce((a, b) => a + b, 0) / late.length
        const change = lateAvg - earlyAvg
        if (change > bestChange) { bestChange = change; bestSubject = subj }
      })
      return { student, subject: bestSubject, change: +bestChange.toFixed(1) }
    })
    .filter(x => x.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 3)
}
