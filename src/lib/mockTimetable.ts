export interface DaySchedule {
  subject: string
  time: string
  teacher: string
  topic: string
  type: 'before-school'
}

export type SubjectName = 'Maths' | 'Science' | 'English' | 'HSIE' | 'Creative Arts' | 'PE'

export const SUBJECT_COLORS: Record<SubjectName, string> = {
  'Maths':         '#3b82f6', // blue
  'Science':       '#10b981', // green
  'English':       '#8b5cf6', // purple
  'HSIE':          '#f97316', // orange
  'Creative Arts': '#ec4899', // pink
  'PE':            '#ef4444', // red
}

export const SUBJECT_BG_COLORS: Record<SubjectName, string> = {
  'Maths':         '#eff6ff',
  'Science':       '#ecfdf5',
  'English':       '#f5f3ff',
  'HSIE':          '#fff7ed',
  'Creative Arts': '#fdf2f8',
  'PE':            '#fef2f2',
}

export const SUBJECT_EMOJIS: Record<SubjectName, string> = {
  'Maths':         '🔢',
  'Science':       '🔬',
  'English':       '📖',
  'HSIE':          '🌏',
  'Creative Arts': '🎨',
  'PE':            '⚽',
}

export const mockTimetable: Record<string, DaySchedule[]> = {
  // ── Week 1: Apr 6–10 ──
  '2026-04-06': [
    { subject: 'Maths',   time: '9:00–10:00',  teacher: 'Ms. Smith',  topic: 'Fractions & Decimals',   type: 'before-school' },
    { subject: 'English', time: '10:30–11:30', teacher: 'Ms. Brown',  topic: 'Narrative Writing',       type: 'before-school' },
    { subject: 'PE',      time: '13:00–14:00', teacher: 'Coach Davis',topic: 'Team Relay Races',        type: 'before-school' },
  ],
  '2026-04-07': [
    { subject: 'Science',       time: '9:00–10:00',  teacher: 'Mr. Jones', topic: 'States of Matter',       type: 'before-school' },
    { subject: 'HSIE',          time: '10:30–11:30', teacher: 'Mr. Wilson',topic: 'Australian Communities', type: 'before-school' },
    { subject: 'Maths',         time: '13:00–14:00', teacher: 'Ms. Smith', topic: 'Multiplication Tables',  type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',  topic: 'Watercolour Basics',     type: 'before-school' },
  ],
  '2026-04-08': [
    { subject: 'English',       time: '9:00–10:00',  teacher: 'Ms. Brown',  topic: 'Persuasive Writing',    type: 'before-school' },
    { subject: 'Maths',         time: '10:30–11:30', teacher: 'Ms. Smith',  topic: 'Long Division',         type: 'before-school' },
    { subject: 'Science',       time: '13:00–14:00', teacher: 'Mr. Jones',  topic: 'Living vs Non-Living',  type: 'before-school' },
  ],
  '2026-04-09': [
    { subject: 'HSIE',          time: '9:00–10:00',  teacher: 'Mr. Wilson', topic: 'Local Government',      type: 'before-school' },
    { subject: 'English',       time: '10:30–11:30', teacher: 'Ms. Brown',  topic: 'Poetry & Rhyme',        type: 'before-school' },
    { subject: 'PE',            time: '13:00–14:00', teacher: 'Coach Davis',topic: 'Soccer Skills',         type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',   topic: 'Colour Theory',         type: 'before-school' },
  ],
  '2026-04-10': [
    { subject: 'Maths',   time: '9:00–10:00',  teacher: 'Ms. Smith',  topic: 'Geometry — Shapes',     type: 'before-school' },
    { subject: 'Science', time: '10:30–11:30', teacher: 'Mr. Jones',  topic: 'Plant Life Cycles',      type: 'before-school' },
    { subject: 'English', time: '13:00–14:00', teacher: 'Ms. Brown',  topic: 'Reading Comprehension',  type: 'before-school' },
  ],

  // ── Week 2: Apr 13–17 ──
  '2026-04-13': [
    { subject: 'Science',       time: '9:00–10:00',  teacher: 'Mr. Jones', topic: 'Food Chains & Webs',     type: 'before-school' },
    { subject: 'Maths',         time: '10:30–11:30', teacher: 'Ms. Smith', topic: 'Perimeter & Area',       type: 'before-school' },
    { subject: 'English',       time: '13:00–14:00', teacher: 'Ms. Brown', topic: 'Grammar — Adjectives',   type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',  topic: 'Sculpture & Clay',       type: 'before-school' },
  ],
  '2026-04-14': [
    { subject: 'HSIE',    time: '9:00–10:00',  teacher: 'Mr. Wilson', topic: 'World Geography',          type: 'before-school' },
    { subject: 'PE',      time: '10:30–11:30', teacher: 'Coach Davis',topic: 'Athletics — Sprint Drills', type: 'before-school' },
    { subject: 'Maths',   time: '13:00–14:00', teacher: 'Ms. Smith',  topic: 'Data & Statistics',        type: 'before-school' },
  ],
  '2026-04-15': [
    { subject: 'English',       time: '9:00–10:00',  teacher: 'Ms. Brown',  topic: 'Dialogue Writing',      type: 'before-school' },
    { subject: 'Science',       time: '10:30–11:30', teacher: 'Mr. Jones',  topic: 'The Water Cycle',       type: 'before-school' },
    { subject: 'HSIE',          time: '13:00–14:00', teacher: 'Mr. Wilson', topic: 'Mapping & Symbols',     type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',   topic: 'Drama — Role Play',     type: 'before-school' },
  ],
  '2026-04-16': [
    { subject: 'Maths',   time: '9:00–10:00',  teacher: 'Ms. Smith',  topic: 'Probability Basics',     type: 'before-school' },
    { subject: 'English', time: '10:30–11:30', teacher: 'Ms. Brown',  topic: 'Informational Texts',    type: 'before-school' },
    { subject: 'PE',      time: '13:00–14:00', teacher: 'Coach Davis',topic: 'Basketball Drills',      type: 'before-school' },
  ],
  '2026-04-17': [
    { subject: 'Science',       time: '9:00–10:00',  teacher: 'Mr. Jones', topic: 'Forces & Motion',        type: 'before-school' },
    { subject: 'HSIE',          time: '10:30–11:30', teacher: 'Mr. Wilson',topic: 'Indigenous Cultures',    type: 'before-school' },
    { subject: 'English',       time: '13:00–14:00', teacher: 'Ms. Brown', topic: 'Book Report Writing',    type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',  topic: 'Music — Rhythm Patterns',type: 'before-school' },
  ],

  // ── Week 3: Apr 20–24 ──
  '2026-04-20': [
    { subject: 'Maths',   time: '9:00–10:00',  teacher: 'Ms. Smith',  topic: 'Fractions — Addition',  type: 'before-school' },
    { subject: 'English', time: '10:30–11:30', teacher: 'Ms. Brown',  topic: 'Speech Writing',        type: 'before-school' },
    { subject: 'PE',      time: '13:00–14:00', teacher: 'Coach Davis',topic: 'Gymnastics Basics',     type: 'before-school' },
  ],
  '2026-04-21': [
    { subject: 'Science',       time: '9:00–10:00',  teacher: 'Mr. Jones', topic: 'Electricity & Circuits',  type: 'before-school' },
    { subject: 'HSIE',          time: '10:30–11:30', teacher: 'Mr. Wilson',topic: 'Early Explorers',          type: 'before-school' },
    { subject: 'Maths',         time: '13:00–14:00', teacher: 'Ms. Smith', topic: 'Algebra Introduction',     type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',  topic: 'Digital Art Basics',       type: 'before-school' },
  ],
  '2026-04-22': [
    { subject: 'English', time: '9:00–10:00',  teacher: 'Ms. Brown',  topic: 'Figurative Language',   type: 'before-school' },
    { subject: 'Maths',   time: '10:30–11:30', teacher: 'Ms. Smith',  topic: 'Angles & Degrees',      type: 'before-school' },
    { subject: 'Science', time: '13:00–14:00', teacher: 'Mr. Jones',  topic: 'Simple Machines',       type: 'before-school' },
  ],
  '2026-04-23': [
    { subject: 'HSIE',          time: '9:00–10:00',  teacher: 'Mr. Wilson', topic: 'Federation of Australia', type: 'before-school' },
    { subject: 'English',       time: '10:30–11:30', teacher: 'Ms. Brown',  topic: 'Comprehension Strategies',type: 'before-school' },
    { subject: 'PE',            time: '13:00–14:00', teacher: 'Coach Davis',topic: 'Swimming Techniques',     type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',   topic: 'Painting — Landscapes',   type: 'before-school' },
  ],
  '2026-04-24': [
    { subject: 'Maths',   time: '9:00–10:00',  teacher: 'Ms. Smith',  topic: 'Volume & Capacity',     type: 'before-school' },
    { subject: 'Science', time: '10:30–11:30', teacher: 'Mr. Jones',  topic: 'Earth & Space',         type: 'before-school' },
    { subject: 'English', time: '13:00–14:00', teacher: 'Ms. Brown',  topic: 'Editing & Proofreading',type: 'before-school' },
  ],

  // ── Week 4: Apr 27 – May 1 ──
  '2026-04-27': [
    { subject: 'Science',       time: '9:00–10:00',  teacher: 'Mr. Jones', topic: 'Ecosystems & Habitats',  type: 'before-school' },
    { subject: 'Maths',         time: '10:30–11:30', teacher: 'Ms. Smith', topic: 'Decimals — Place Value',  type: 'before-school' },
    { subject: 'English',       time: '13:00–14:00', teacher: 'Ms. Brown', topic: 'Formal vs Informal',      type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',  topic: 'Collage & Mixed Media',   type: 'before-school' },
  ],
  '2026-04-28': [
    { subject: 'HSIE',  time: '9:00–10:00',  teacher: 'Mr. Wilson', topic: 'Environment & Sustainability', type: 'before-school' },
    { subject: 'PE',    time: '10:30–11:30', teacher: 'Coach Davis',topic: 'Touch Football',               type: 'before-school' },
    { subject: 'Maths', time: '13:00–14:00', teacher: 'Ms. Smith',  topic: 'Number Patterns',              type: 'before-school' },
  ],
  '2026-04-29': [
    { subject: 'English', time: '9:00–10:00',  teacher: 'Ms. Brown', topic: 'Creative Short Story',     type: 'before-school' },
    { subject: 'Science', time: '10:30–11:30', teacher: 'Mr. Jones', topic: 'Rocks & Minerals',         type: 'before-school' },
    { subject: 'HSIE',    time: '13:00–14:00', teacher: 'Mr. Wilson',topic: 'Trade & Economy',          type: 'before-school' },
  ],
  '2026-04-30': [
    { subject: 'Maths',         time: '9:00–10:00',  teacher: 'Ms. Smith',  topic: 'Problem Solving',        type: 'before-school' },
    { subject: 'English',       time: '10:30–11:30', teacher: 'Ms. Brown',  topic: 'Descriptive Writing',    type: 'before-school' },
    { subject: 'PE',            time: '13:00–14:00', teacher: 'Coach Davis',topic: 'Cross Country Training',  type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',   topic: 'Printmaking',            type: 'before-school' },
  ],
  '2026-05-01': [
    { subject: 'Science', time: '9:00–10:00',  teacher: 'Mr. Jones', topic: 'Weather & Climate',      type: 'before-school' },
    { subject: 'HSIE',    time: '10:30–11:30', teacher: 'Mr. Wilson',topic: 'Democracy & Voting',     type: 'before-school' },
    { subject: 'English', time: '13:00–14:00', teacher: 'Ms. Brown', topic: 'Research Skills',        type: 'before-school' },
  ],

  // ── Week 5: May 4–8 ──
  '2026-05-04': [
    { subject: 'Maths',         time: '9:00–10:00',  teacher: 'Ms. Smith',  topic: 'Percentages',           type: 'before-school' },
    { subject: 'English',       time: '10:30–11:30', teacher: 'Ms. Brown',  topic: 'Comparative Writing',   type: 'before-school' },
    { subject: 'PE',            time: '13:00–14:00', teacher: 'Coach Davis',topic: 'Netball Skills',        type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',   topic: 'Photography Basics',    type: 'before-school' },
  ],
  '2026-05-05': [
    { subject: 'Science', time: '9:00–10:00',  teacher: 'Mr. Jones', topic: 'Human Body Systems',     type: 'before-school' },
    { subject: 'HSIE',    time: '10:30–11:30', teacher: 'Mr. Wilson',topic: 'Cultural Diversity',     type: 'before-school' },
    { subject: 'Maths',   time: '13:00–14:00', teacher: 'Ms. Smith', topic: 'Ratio & Proportion',     type: 'before-school' },
  ],
  '2026-05-06': [
    { subject: 'English',       time: '9:00–10:00',  teacher: 'Ms. Brown',  topic: 'Debating Skills',       type: 'before-school' },
    { subject: 'Maths',         time: '10:30–11:30', teacher: 'Ms. Smith',  topic: 'Symmetry & Reflection', type: 'before-school' },
    { subject: 'Science',       time: '13:00–14:00', teacher: 'Mr. Jones',  topic: 'Sound & Light',         type: 'before-school' },
    { subject: 'Creative Arts', time: '14:15–15:00', teacher: 'Ms. Chen',   topic: 'Dance Choreography',    type: 'before-school' },
  ],
  '2026-05-07': [
    { subject: 'HSIE',  time: '9:00–10:00',  teacher: 'Mr. Wilson', topic: 'Rights & Responsibilities', type: 'before-school' },
    { subject: 'English',time: '10:30–11:30', teacher: 'Ms. Brown',  topic: 'Mythology & Legends',       type: 'before-school' },
    { subject: 'PE',    time: '13:00–14:00', teacher: 'Coach Davis',topic: 'Fitness Testing',            type: 'before-school' },
  ],
  '2026-05-08': [
    { subject: 'Maths',   time: '9:00–10:00',  teacher: 'Ms. Smith',  topic: 'Order of Operations',   type: 'before-school' },
    { subject: 'Science', time: '10:30–11:30', teacher: 'Mr. Jones',  topic: 'Energy & Conservation',  type: 'before-school' },
    { subject: 'English', time: '13:00–14:00', teacher: 'Ms. Brown',  topic: 'Term Review & Reflection',type: 'before-school' },
  ],
}

/** Returns the schedule for a given date string (YYYY-MM-DD), or [] if no school. */
export function getScheduleForDate(date: string): DaySchedule[] {
  return mockTimetable[date] ?? []
}

/** Returns all dates that have scheduled classes. */
export function getSchoolDays(): string[] {
  return Object.keys(mockTimetable).sort()
}
