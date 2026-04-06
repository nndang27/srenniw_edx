export interface QuickPeekData {
  essence_text: string
  relatable_example: string
  core_concept: string
  key_vocabulary: Record<string, string>
  why_this_matters: string
  videos: string[]
}

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

// ── Quick Peek Data ──────────────────────────────────────────────────────────

const QUICK_PEEK_MAP: Record<string, QuickPeekData> = {
  'Maths:Fractions & Decimals': {
    essence_text: 'Today your child explored how whole numbers split into parts — fractions like ½ and ¼ — and how decimals like 0.5 and 0.25 say the same thing in a different way.',
    relatable_example: 'Cutting a pizza into 4 slices: eating 1 slice is ¼ of the pizza, or 0.25. Two slices = ½ = 0.5.',
    core_concept: 'Fractions and decimals are two ways to write numbers smaller than 1. The denominator tells you how many equal parts the whole was divided into.',
    key_vocabulary: {
      'Fraction': 'A number that represents part of a whole, written as one number over another (e.g. ¾)',
      'Numerator': 'The top number in a fraction — how many parts you have',
      'Denominator': 'The bottom number — how many equal parts the whole is split into',
      'Decimal': 'A number with a dot (decimal point) to show parts of a whole (e.g. 0.75)',
    },
    why_this_matters: 'Fractions and decimals appear every day — in cooking measurements, money, sport statistics, and sharing things fairly.',
    videos: [],
  },
  'English:Narrative Writing': {
    essence_text: 'Your child practised writing stories today — how to build a character, set a scene, and take a reader through a beginning, middle, and end.',
    relatable_example: 'Think of any movie: it starts with a hero in their normal world, something disrupts it, they face challenges, then solve them. Stories follow the same structure.',
    core_concept: 'A narrative has a clear structure: orientation (who, where, when), complication (the problem), and resolution (how it\'s solved). Strong stories use sensory detail and dialogue.',
    key_vocabulary: {
      'Orientation': 'The opening that introduces characters, setting and time',
      'Complication': 'The problem or conflict that drives the story',
      'Resolution': 'How the problem is solved at the end',
      'Dialogue': 'Words that characters speak, shown in speech marks',
    },
    why_this_matters: 'Being able to tell a story — in writing, speech, or visuals — is one of the most powerful communication skills a person can have.',
    videos: [],
  },
  'PE:Team Relay Races': {
    essence_text: 'Your child worked on relay racing today — a team sport where each runner passes a baton to the next, combining individual speed with teamwork.',
    relatable_example: 'Like a bucket brigade — each person does their bit and hands it on. The team wins or loses together, so communication and timing matter as much as speed.',
    core_concept: 'Relay races build cardiovascular fitness, coordination, and cooperation. The baton exchange zone is the critical skill — a smooth handoff can win or lose a race.',
    key_vocabulary: {
      'Baton': 'The short stick passed between runners in a relay',
      'Exchange zone': 'The marked area where the baton must be handed over',
      'Cardiovascular': 'Relating to the heart and blood vessels — improved by aerobic activity',
      'Pacing': 'Running at a controlled speed to manage energy across a race',
    },
    why_this_matters: 'Relays teach children that personal performance affects others — a core life skill in team environments from sport to work.',
    videos: [],
  },
  'Science:States of Matter': {
    essence_text: 'Your child learned that everything around us exists as a solid, liquid, or gas — and that matter can change between these states when heated or cooled.',
    relatable_example: 'Ice (solid) → water (liquid) → steam (gas). The water didn\'t disappear — it just changed state as energy (heat) was added.',
    core_concept: 'All matter is made of particles. In solids they\'re tightly packed; in liquids they flow; in gases they spread out freely. Adding heat gives particles more energy to move.',
    key_vocabulary: {
      'Matter': 'Anything that has mass and takes up space',
      'Solid': 'Fixed shape and volume — particles are tightly packed',
      'Liquid': 'Fixed volume but takes the shape of its container',
      'Gas': 'No fixed shape or volume — particles spread out to fill space',
      'Melting': 'Changing from solid to liquid by adding heat',
      'Evaporation': 'Changing from liquid to gas',
    },
    why_this_matters: 'Understanding states of matter is the foundation for chemistry, cooking, weather patterns, and engineering.',
    videos: [],
  },
  'HSIE:Australian Communities': {
    essence_text: 'Your child explored what makes up communities in Australia — from neighbourhoods and services to the people and rules that hold them together.',
    relatable_example: 'Your suburb is a community: it has a school, shops, parks, roads, and people who share those spaces and follow the same local rules.',
    core_concept: 'Communities are groups of people living in a shared place with shared services and connections. They can be local, regional, or national, and they have institutions (schools, councils, hospitals) that serve members.',
    key_vocabulary: {
      'Community': 'A group of people living in the same place or sharing common interests',
      'Service': 'Help provided to community members — like healthcare, education, or transport',
      'Institution': 'An established organisation that serves an important function in society',
      'Local government': 'The council that makes decisions for a suburb or region',
    },
    why_this_matters: 'Understanding communities helps children become active, informed citizens who can contribute and advocate for their neighbourhood.',
    videos: [],
  },
  'Maths:Multiplication Tables': {
    essence_text: 'Your child drilled multiplication facts today — the building blocks of almost all higher maths, from long multiplication to fractions to algebra.',
    relatable_example: '3 × 4 = 12. Imagine 3 rows of 4 apples — you could count them one by one, or just know the fact instantly. Knowing times tables removes that counting step forever.',
    core_concept: 'Multiplication is repeated addition. 6 × 7 means six groups of seven. Knowing multiplication tables from memory frees up mental capacity for harder maths problems.',
    key_vocabulary: {
      'Multiple': 'The result of multiplying a number by an integer (e.g. multiples of 3: 3, 6, 9, 12…)',
      'Factor': 'A number that divides evenly into another (e.g. factors of 12: 1, 2, 3, 4, 6, 12)',
      'Product': 'The result of multiplying two numbers together',
      'Array': 'Objects arranged in rows and columns to show multiplication visually',
    },
    why_this_matters: 'Fluent recall of multiplication tables is the single biggest predictor of success in upper primary and high school maths.',
    videos: [],
  },
  'Creative Arts:Watercolour Basics': {
    essence_text: 'Your child explored watercolour painting — learning how water controls the paint and how layering colours creates depth and texture.',
    relatable_example: 'Adding more water makes colours lighter and more transparent. Adding less makes them bold and intense. It\'s like adjusting a volume dial — water is the control.',
    core_concept: 'Watercolour works by suspending pigment in water. Wet-on-wet blending creates soft edges; wet-on-dry gives sharp lines. Layers (glazing) build colour depth.',
    key_vocabulary: {
      'Pigment': 'The coloured powder in paint',
      'Transparency': 'How see-through a colour is — watercolours are naturally transparent',
      'Wet-on-wet': 'Applying wet paint onto a wet surface to create soft blends',
      'Glazing': 'Layering transparent washes to build up colour or shadow',
    },
    why_this_matters: 'Watercolour teaches patience, observation of cause-and-effect, and how to embrace "happy accidents" — skills that transfer to creative thinking in any domain.',
    videos: [],
  },
  'English:Persuasive Writing': {
    essence_text: 'Your child learned how to write arguments that convince others — using evidence, emotive language, and a clear structure to make a point persuasively.',
    relatable_example: 'Any time you ask for something and give reasons ("I should stay up later because I always finish my homework"), you\'re using persuasion. Writing it down makes it even more powerful.',
    core_concept: 'Persuasive texts state a clear position, give structured arguments supported by evidence, use persuasive techniques (rule of three, rhetorical questions, emotive language), and close with a strong call to action.',
    key_vocabulary: {
      'Thesis': 'The main argument or position the writer is defending',
      'Evidence': 'Facts, statistics, or examples that support an argument',
      'Rhetoric': 'The art of effective or persuasive speaking or writing',
      'Emotive language': 'Words chosen to trigger an emotional response in the reader',
    },
    why_this_matters: 'Persuasive writing is foundational for essays, debates, job applications, and any situation where you need to make a case.',
    videos: [],
  },
  'Maths:Long Division': {
    essence_text: 'Your child practised long division today — breaking a large number into groups and working through the problem step by step.',
    relatable_example: 'Sharing 84 lollies equally among 4 friends: 4 goes into 8 twice (put 20 aside), 4 goes into 4 once — so each friend gets 21.',
    core_concept: 'Long division uses a repeated sequence: Divide → Multiply → Subtract → Bring down. Each step reduces the problem until there\'s nothing left (or a remainder).',
    key_vocabulary: {
      'Dividend': 'The number being divided (the big number)',
      'Divisor': 'The number you\'re dividing by',
      'Quotient': 'The answer — how many times the divisor fits into the dividend',
      'Remainder': 'The amount left over when the dividend doesn\'t divide evenly',
    },
    why_this_matters: 'Long division builds number sense and logical step-by-step thinking. It underpins fractions, ratios, and algebra later on.',
    videos: [],
  },
  'Science:Living vs Non-Living': {
    essence_text: 'Your child explored how scientists classify things as living or non-living using a set of life processes — not just "can it move?"',
    relatable_example: 'A fire moves, grows, and needs oxygen — but it\'s not alive. A cactus doesn\'t move much at all, but it is alive. The difference? Living things reproduce, respire, and respond to their environment.',
    core_concept: 'All living things share seven life processes (MRS NERG): Movement, Respiration, Sensitivity, Nutrition, Excretion, Reproduction, Growth. Non-living things lack one or more of these.',
    key_vocabulary: {
      'Organism': 'A living thing',
      'Respiration': 'The process cells use to release energy from food',
      'Reproduction': 'The process of making more of the same organism',
      'Stimulus': 'Something in the environment that causes a response',
    },
    why_this_matters: 'Classification is the first step in all of biology — it teaches children to observe carefully and think in categories, a skill used across science and life.',
    videos: [],
  },
  'HSIE:Local Government': {
    essence_text: 'Your child learned about local government — the council level of democracy closest to home — and the services it provides to the community.',
    relatable_example: 'Your local council maintains the playground in your park, collects the bins, and decides where new roads are built. It\'s the government you interact with most without realising it.',
    core_concept: 'Australia has three levels of government: federal, state, and local. Local councils manage services like roads, parks, libraries, and waste. Citizens can vote in council elections and attend council meetings.',
    key_vocabulary: {
      'Council': 'The elected body that governs a local area',
      'Mayor': 'The elected head of a local council',
      'Rate': 'A tax paid by property owners to fund local services',
      'Zoning': 'Rules about how land in an area can be used',
    },
    why_this_matters: 'Understanding local government empowers children to see how they can participate in decisions that affect their neighbourhood.',
    videos: [],
  },
  'English:Poetry & Rhyme': {
    essence_text: 'Your child explored poetry today — how poets use rhythm, rhyme, and carefully chosen words to create emotion and images in the reader\'s mind.',
    relatable_example: 'Song lyrics are poems set to music. The reason songs get stuck in your head is rhythm and rhyme — the same techniques poets use.',
    core_concept: 'Poetry uses sound devices (rhyme, alliteration, onomatopoeia) and structural elements (stanzas, metre) to create meaning beyond literal words. Figurative language (metaphor, simile) paints pictures.',
    key_vocabulary: {
      'Stanza': 'A grouped set of lines in a poem (like a verse in a song)',
      'Rhyme scheme': 'The pattern of rhymes at the end of lines (ABAB, AABB, etc.)',
      'Alliteration': 'When words nearby start with the same sound ("Peter Piper picked…")',
      'Onomatopoeia': 'A word that sounds like what it describes (buzz, crash, sizzle)',
    },
    why_this_matters: 'Poetry sharpens sensitivity to language — it builds vocabulary, emotional literacy, and an ear for how words sound, which improves all writing.',
    videos: [],
  },
  'PE:Soccer Skills': {
    essence_text: 'Your child worked on fundamental soccer skills today: dribbling, passing, and shooting — the building blocks of the world\'s most popular sport.',
    relatable_example: 'Dribbling a ball in soccer is like walking and talking at the same time — your feet do the work automatically while your eyes watch the game. That takes practice!',
    core_concept: 'Soccer skills combine gross motor control with spatial awareness and decision-making. Passing accuracy depends on foot placement and follow-through; dribbling requires close ball control and agility.',
    key_vocabulary: {
      'Dribbling': 'Moving the ball forward with small, controlled touches of the foot',
      'Instep pass': 'A pass made with the inside of the foot for accuracy',
      'Shooting': 'Striking the ball toward the goal with power or placement',
      'Spatial awareness': 'Understanding where you and others are on the field',
    },
    why_this_matters: 'Soccer develops cardiovascular fitness, coordination, teamwork, and strategic thinking — skills valuable far beyond the pitch.',
    videos: [],
  },
  'Creative Arts:Colour Theory': {
    essence_text: 'Your child learned how colours relate to each other — which mix to make new colours, which create contrast, and how colour choices affect the mood of artwork.',
    relatable_example: 'Why do hospitals often use soft blues and greens? Because colour affects emotion. Artists use this deliberately — warm reds feel exciting, cool blues feel calm.',
    core_concept: 'The colour wheel shows primary colours (red, blue, yellow), secondary colours (mixed from two primaries), and complementary colours (opposites on the wheel). Warm colours advance; cool colours recede.',
    key_vocabulary: {
      'Primary colours': 'Red, blue, and yellow — cannot be made by mixing others',
      'Secondary colours': 'Orange, green, purple — made by mixing two primaries',
      'Complementary colours': 'Colours opposite each other on the wheel (e.g. red & green)',
      'Hue': 'The pure colour itself (e.g. red is a hue)',
      'Tint': 'A colour mixed with white to make it lighter',
    },
    why_this_matters: 'Colour theory is used in design, marketing, architecture, film, and fashion — understanding it builds visual literacy for the modern world.',
    videos: [],
  },
  'Maths:Geometry — Shapes': {
    essence_text: 'Your child explored 2D and 3D shapes today — their properties like sides, angles, faces, and vertices, and how to classify and describe them precisely.',
    relatable_example: 'A cereal box is a rectangular prism: 6 faces, 12 edges, 8 vertices. A Toblerone box is a triangular prism. Learning to name and describe shapes means you can communicate precisely about the physical world.',
    core_concept: 'Geometry studies shapes and their properties. 2D shapes have length and width; 3D shapes also have depth. Properties include the number of sides/faces, type of angles (acute, obtuse, right), symmetry, and regularity.',
    key_vocabulary: {
      'Vertex': 'A corner point where edges meet (plural: vertices)',
      'Edge': 'A straight line where two faces of a 3D shape meet',
      'Face': 'A flat surface of a 3D shape',
      'Polygon': 'A closed 2D shape with straight sides',
      'Symmetry': 'When a shape can be divided into identical halves',
    },
    why_this_matters: 'Geometry is used in architecture, engineering, art, and design — and it builds spatial reasoning, which is linked to success in STEM.',
    videos: [],
  },
  'Science:Plant Life Cycles': {
    essence_text: 'Your child learned how plants grow from seed to full plant and back to seed — a continuous cycle that keeps plant species alive.',
    relatable_example: 'A sunflower seed buried in soil germinates, grows a stem and leaves, flowers, gets pollinated (often by bees), produces seeds, and those seeds fall to start the cycle again.',
    core_concept: 'Plant life cycles have key stages: germination (seed sprouts), seedling, mature plant, flowering, pollination, seed dispersal, and dormancy. Different plants have different cycle lengths — from weeks to centuries.',
    key_vocabulary: {
      'Germination': 'When a seed begins to sprout and grow',
      'Pollination': 'Transfer of pollen from one flower to another, enabling reproduction',
      'Seed dispersal': 'How seeds travel away from the parent plant (wind, animals, water)',
      'Photosynthesis': 'How plants use sunlight, water and CO₂ to make their own food',
    },
    why_this_matters: 'Understanding plant life cycles connects to food production, ecology, environmental science, and the conditions needed to sustain all life on Earth.',
    videos: [],
  },
  'English:Reading Comprehension': {
    essence_text: 'Your child practised reading strategies today — how to find the main idea, make inferences, and use context to understand unfamiliar words.',
    relatable_example: 'When you read a news headline and instantly understand the full story isn\'t told yet, you\'re predicting and inferring. Good readers do this automatically — it can be taught.',
    core_concept: 'Reading comprehension goes beyond decoding words. It includes: identifying main idea and supporting details, making inferences (reading between the lines), visualising, summarising, and questioning the text.',
    key_vocabulary: {
      'Inference': 'A conclusion drawn from evidence in the text — not stated directly',
      'Main idea': 'The most important point the author wants to communicate',
      'Context clues': 'Words or phrases near an unfamiliar word that help work out its meaning',
      'Summarise': 'To restate the key points of a text in your own words, briefly',
    },
    why_this_matters: 'Strong reading comprehension is the foundation of all academic learning — every subject requires reading and making sense of text.',
    videos: [],
  },
}

const SUBJECT_FALLBACK: Record<string, Omit<QuickPeekData, 'essence_text'>> = {
  'Maths': {
    relatable_example: 'Maths shows up in cooking, shopping, sport scores, and building — your child is learning the tools that make sense of the world.',
    core_concept: 'Mathematics builds logical reasoning and problem-solving skills through numbers, patterns, measurement, and space.',
    key_vocabulary: {
      'Estimate': 'To make a rough calculation or judgement',
      'Equation': 'A mathematical statement showing two things are equal',
      'Strategy': 'A planned method for solving a problem',
    },
    why_this_matters: 'Mathematical thinking is one of the most transferable skills a student can develop — it underpins science, finance, technology, and everyday decisions.',
    videos: [],
  },
  'Science': {
    relatable_example: 'Everything from cooking and weather to phones and medicine comes from scientific discovery — your child is learning to ask "why?" and "how?"',
    core_concept: 'Science uses observation, hypothesis, experimentation, and evidence to understand the natural world.',
    key_vocabulary: {
      'Hypothesis': 'A prediction that can be tested by an experiment',
      'Variable': 'Something that can change in an experiment',
      'Evidence': 'Data collected through observation or experiment',
    },
    why_this_matters: 'Scientific literacy helps children make informed decisions, evaluate claims critically, and engage with the big challenges facing society.',
    videos: [],
  },
  'English': {
    relatable_example: 'Every text, email, story, or conversation relies on the language skills your child is developing right now.',
    core_concept: 'English develops reading, writing, speaking, and listening skills — enabling communication, self-expression, and critical thinking.',
    key_vocabulary: {
      'Vocabulary': 'The body of words a person knows and uses',
      'Genre': 'A category of text with shared features (e.g. narrative, report, poetry)',
      'Audience': 'The intended reader or listener for a piece of writing or speech',
    },
    why_this_matters: 'Strong English skills open every other academic door — clear communication and comprehension are required in every subject and career.',
    videos: [],
  },
  'HSIE': {
    relatable_example: 'Understanding history, geography, and society helps your child make sense of the news, their heritage, and the world around them.',
    core_concept: 'HSIE (Human Society and Its Environment) explores how people, places, cultures, and systems shape our world — past and present.',
    key_vocabulary: {
      'Society': 'A group of people living together under shared rules and culture',
      'Environment': 'The natural and built world surrounding us',
      'Citizenship': 'The rights and responsibilities of being a member of a community',
    },
    why_this_matters: 'Social and historical understanding builds empathy, cultural awareness, and the capacity to be an informed, active citizen.',
    videos: [],
  },
  'Creative Arts': {
    relatable_example: 'Art, music, drama, and dance are languages — ways of expressing ideas and emotions that words alone can\'t capture.',
    core_concept: 'Creative Arts develop visual, musical, dramatic, and movement literacy. Students learn to make, perform, and appreciate creative works.',
    key_vocabulary: {
      'Medium': 'The material or tool used to create art (e.g. paint, clay, pencil)',
      'Composition': 'The arrangement of elements in an artwork or performance',
      'Critique': 'A thoughtful evaluation of creative work using specific criteria',
    },
    why_this_matters: 'Creative arts build confidence, self-expression, emotional intelligence, and innovative thinking — essential in a rapidly changing world.',
    videos: [],
  },
  'PE': {
    relatable_example: 'The physical habits children build now — movement, exercise, teamwork — shape their health and wellbeing for life.',
    core_concept: 'Physical Education develops movement skills, fitness, sportsmanship, and an understanding of how the body works.',
    key_vocabulary: {
      'Coordination': 'The ability to move different body parts together smoothly',
      'Agility': 'The ability to change direction quickly and with control',
      'Sportsmanship': 'Fair, generous, and respectful behaviour in sport',
    },
    why_this_matters: 'Regular physical activity improves concentration, mental health, and academic performance — PE teaches children to value movement for life.',
    videos: [],
  },
}

/**
 * Returns Quick Peek data for a given subject + topic combination.
 * Falls back to subject-level data if the specific topic isn't in the map.
 */
export function getQuickPeekForSchedule(subject: string, topic: string): QuickPeekData {
  const key = `${subject}:${topic}`
  if (QUICK_PEEK_MAP[key]) return QUICK_PEEK_MAP[key]

  const fallback = SUBJECT_FALLBACK[subject]
  if (fallback) {
    return {
      essence_text: `Today your child studied ${topic} in ${subject}. Here's a quick overview of what they were exploring.`,
      ...fallback,
    }
  }

  return {
    essence_text: `Today your child learned about ${topic} in ${subject}.`,
    relatable_example: 'Ask your child to explain what they did in class today in their own words.',
    core_concept: `The class covered ${topic} as part of the ${subject} curriculum.`,
    key_vocabulary: {},
    why_this_matters: 'Each lesson builds on the last, helping your child develop deeper understanding over time.',
    videos: [],
  }
}

/** Returns all dates that have scheduled classes. */
export function getSchoolDays(): string[] {
  return Object.keys(mockTimetable).sort()
}
