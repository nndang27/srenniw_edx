'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  BookOpen, Zap, Dumbbell, NotebookPen, MessageSquare, RefreshCw,
  Calendar, Target, GraduationCap, Clock,
  Car, UtensilsCrossed, Bath, ShoppingCart, Blocks, CookingPot,
  ChefHat, MapPin, Palette,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  getScheduleForDate,
  getQuickPeekForSchedule,
  SUBJECT_COLORS,
  SUBJECT_BG_COLORS,
  SUBJECT_EMOJIS,
  type SubjectName,
} from '@/lib/mockTimetable'
import { saveJournalEntry, getTodayDate } from '@/lib/journal'
import TikTokHookPanel from '@/components/quick-peek/TikTokHookPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

/* ─── Types ──────────────────────────────────────────────────────────── */

type TabId = 'journey' | 'activity' | 'journal'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'journey', label: 'Journey', icon: Zap },
  { id: 'activity', label: 'Activity', icon: Dumbbell },
  { id: 'journal', label: 'Journal', icon: NotebookPen },
]

/* ─── Journal constants ──────────────────────────────────────────────── */

const COGNITIVE_LEVELS = [
  { id: 1, label: 'Aware', desc: 'Knows about the topic' },
  { id: 2, label: 'Understands', desc: 'Can explain it' },
  { id: 3, label: 'Applies', desc: 'Can use it to solve problems' },
  { id: 4, label: 'Analyses', desc: 'Can compare and organise' },
  { id: 5, label: 'Creates', desc: 'Can design new things with it' },
]

const EMOTIONS = [
  { id: 1, emoji: '😰', label: 'Anxious' },
  { id: 2, emoji: '😴', label: 'Disengaged' },
  { id: 3, emoji: '😐', label: 'Neutral' },
  { id: 4, emoji: '🤔', label: 'Curious' },
  { id: 5, emoji: '😊', label: 'Excited' },
  { id: 6, emoji: '😄', label: 'Happy' },
]

/* ─── Review prompts per subject ─────────────────────────────────────── */

interface ReviewPrompt {
  moment: string
  icon: 'car' | 'dinner' | 'bath' | 'shopping' | 'play' | 'kitchen'
  topic: string
  prompt: string
  reviewGoal: string
  timeNeeded: string
}

const MOMENT_ICONS = {
  car: Car,
  dinner: UtensilsCrossed,
  bath: Bath,
  shopping: ShoppingCart,
  play: Blocks,
  kitchen: CookingPot,
} as const

const SUBJECT_PROMPTS: Record<string, ReadonlyArray<ReviewPrompt>> = {
  Maths: [
    {
      moment: 'At the shops',
      icon: 'shopping',
      topic: 'Decimals & Addition',
      prompt: "'Can you find two items that together cost less than $5? Let's add them up!'",
      reviewGoal: 'Reinforces addition of decimals and comparing values',
      timeNeeded: '5 min',
    },
    {
      moment: 'Cooking together',
      icon: 'kitchen',
      topic: 'Equivalent Fractions',
      prompt: "'If we cut this pizza into 8 slices instead of 4, how many slices equal one half?'",
      reviewGoal: 'Reviews equivalent fractions from class',
      timeNeeded: '2 min',
    },
    {
      moment: 'In the car',
      icon: 'car',
      topic: 'Division & Halving',
      prompt: "'I see 10 cars. If half are white, how many white cars are there?'",
      reviewGoal: 'Practises halving and basic division',
      timeNeeded: '1 min',
    },
    {
      moment: 'At dinner',
      icon: 'dinner',
      topic: 'Division',
      prompt: "'If we share 12 grapes equally between 4 people, how many each?'",
      reviewGoal: 'Practises equal sharing and division facts',
      timeNeeded: '1 min',
    },
    {
      moment: 'Bath time',
      icon: 'bath',
      topic: 'Fractions',
      prompt: "'Is this cup 1/4 full or 1/2 full? How can you tell?'",
      reviewGoal: 'Visual estimation and fraction recognition',
      timeNeeded: '2 min',
    },
  ],
  Science: [
    {
      moment: 'In the car',
      icon: 'car',
      topic: 'States of Matter',
      prompt: "'Why does the car window fog up in winter? What state of matter is that?'",
      reviewGoal: 'Connects condensation to real-world observation',
      timeNeeded: '2 min',
    },
    {
      moment: 'Cooking together',
      icon: 'kitchen',
      topic: 'Energy & Heat',
      prompt: "'What happens to the water when we boil it? Where does it go?'",
      reviewGoal: 'Reviews evaporation and energy transfer',
      timeNeeded: '3 min',
    },
    {
      moment: 'Playtime',
      icon: 'play',
      topic: 'Forces & Motion',
      prompt: "'How does the ball slow down after you throw it? What force is doing that?'",
      reviewGoal: 'Reinforces friction and gravity concepts',
      timeNeeded: '2 min',
    },
    {
      moment: 'At dinner',
      icon: 'dinner',
      topic: 'Living Things',
      prompt: "'Where does the energy in our food originally come from?'",
      reviewGoal: 'Connects food chains and photosynthesis',
      timeNeeded: '3 min',
    },
  ],
  English: [
    {
      moment: 'At dinner',
      icon: 'dinner',
      topic: 'Vocabulary',
      prompt: "'Use a word you learned at school today in a sentence — and make it interesting!'",
      reviewGoal: 'Encourages active vocabulary use and creative language',
      timeNeeded: '2 min',
    },
    {
      moment: 'In the car',
      icon: 'car',
      topic: 'Persuasive Writing',
      prompt: "'You have 2 minutes to convince me to let you choose dinner. Go!'",
      reviewGoal: 'Practises persuasive techniques from class',
      timeNeeded: '2 min',
    },
    {
      moment: 'Playtime',
      icon: 'play',
      topic: 'Creative Writing',
      prompt: "'Make up a story in 5 sentences — it must have a problem and a solution.'",
      reviewGoal: 'Reviews narrative structure: orientation, complication, resolution',
      timeNeeded: '5 min',
    },
    {
      moment: 'Bath time',
      icon: 'bath',
      topic: 'Reading Comprehension',
      prompt: "'Tell me about the last book you read — what was the main character's biggest challenge?'",
      reviewGoal: 'Builds oral comprehension and retelling skills',
      timeNeeded: '3 min',
    },
  ],
  HSIE: [
    {
      moment: 'In the car',
      icon: 'car',
      topic: 'Community & Place',
      prompt: "'Can you spot 5 different community roles on this drive? What does each person do?'",
      reviewGoal: 'Reinforces community interdependence concepts',
      timeNeeded: '5 min',
    },
    {
      moment: 'At dinner',
      icon: 'dinner',
      topic: 'Geography',
      prompt: "'Where do you think the food on our plate came from? Let's trace its journey.'",
      reviewGoal: 'Connects geography, trade, and place to everyday life',
      timeNeeded: '5 min',
    },
    {
      moment: 'At the shops',
      icon: 'shopping',
      topic: 'Economics & Trade',
      prompt: "'Why are some things here made in other countries? How did they get here?'",
      reviewGoal: 'Reviews trade routes and global interdependence',
      timeNeeded: '3 min',
    },
  ],
  'Creative Arts': [
    {
      moment: 'Cooking together',
      icon: 'kitchen',
      topic: 'Colour & Design',
      prompt: "'If you could design the plate for this meal, what colours and patterns would you use?'",
      reviewGoal: 'Applies visual arts design principles creatively',
      timeNeeded: '3 min',
    },
    {
      moment: 'In the car',
      icon: 'car',
      topic: 'Music & Rhythm',
      prompt: "'Can you tap the beat of this song with your hands? Is it fast or slow — how does it make you feel?'",
      reviewGoal: 'Practises beat, tempo, and emotional response to music',
      timeNeeded: '2 min',
    },
    {
      moment: 'Playtime',
      icon: 'play',
      topic: 'Drama',
      prompt: "'Act out a scene from your day — but make it dramatic! Add emotions and pauses.'",
      reviewGoal: 'Builds expressive performance and characterisation skills',
      timeNeeded: '5 min',
    },
  ],
  PE: [
    {
      moment: 'Playtime',
      icon: 'play',
      topic: 'Coordination',
      prompt: "'Try to juggle 2 items for 10 seconds. What muscles are you using to stay balanced?'",
      reviewGoal: 'Builds hand-eye coordination and body awareness',
      timeNeeded: '5 min',
    },
    {
      moment: 'In the car',
      icon: 'car',
      topic: 'Health & Wellbeing',
      prompt: "'Name 3 things you can do today that are good for your body AND your mind.'",
      reviewGoal: 'Reinforces physical and mental wellbeing connections',
      timeNeeded: '2 min',
    },
    {
      moment: 'Bath time',
      icon: 'bath',
      topic: 'Recovery & Nutrition',
      prompt: "'Why do we need to drink water after exercise? What is our body doing?'",
      reviewGoal: 'Connects hydration and recovery to physical health',
      timeNeeded: '2 min',
    },
  ],
}

/* ─── Activity cards per subject ─────────────────────────────────────── */

interface ActivityCard {
  emoji: string
  title: string
  description: string
  duration: string
  difficulty: 'Easy' | 'Medium'
  color: string
  calendarKey: string
  lessonLink: string
  learningGoals: string[]
  parentTip: string
  icon: 'chef' | 'map' | 'palette'
  materials: string[]
}

const CARD_ICONS = {
  chef: ChefHat,
  map: MapPin,
  palette: Palette,
} as const

const PASTEL_CARD_GRADIENTS: readonly string[] = [
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-cyan-400 to-teal-500',
  'from-orange-400 to-amber-500',
  'from-blue-500 to-indigo-600',
  'from-emerald-400 to-green-500',
  'from-fuchsia-500 to-pink-600',
  'from-red-400 to-orange-500',
]

const ACTIVITY_CARDS: Record<string, ActivityCard[]> = {
  Maths: [
    {
      emoji: '🎲',
      title: 'Fraction War Card Game',
      description: 'Use a deck of cards to create fractions. Highest fraction wins the round.',
      duration: '15 min',
      difficulty: 'Easy',
      color: 'from-blue-400 to-blue-600',
      calendarKey: 'Fraction+War+Card+Game',
      lessonLink: 'Fractions',
      learningGoals: ['Compare fractions with unlike denominators', 'Build mental maths speed'],
      parentTip: 'If they can explain why 3/4 beats 2/3, they\'ve got it!',
      icon: 'chef',
      materials: ['deck of cards', 'paper', 'pencil'],
    },
    {
      emoji: '🛒',
      title: 'Supermarket Maths',
      description: 'Let them calculate totals and change during the next grocery run.',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-blue-400 to-blue-600',
      calendarKey: 'Supermarket+Maths+Activity',
      lessonLink: 'Decimals & Money',
      learningGoals: ['Add prices mentally', 'Estimate totals and calculate change'],
      parentTip: 'Ask "Is this closer to $3 or $4?" — estimating builds number sense.',
      icon: 'map',
      materials: ['shopping list', 'pen'],
    },
    {
      emoji: '📏',
      title: 'Measure the House',
      description: 'Estimate then measure furniture — compare metric and informal units.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-blue-400 to-blue-600',
      calendarKey: 'Measure+the+House',
      lessonLink: 'Measurement',
      learningGoals: ['Use rulers and tape measures accurately', 'Convert between units'],
      parentTip: 'Ask them to predict before measuring — estimation is a key maths skill.',
      icon: 'palette',
      materials: ['ruler', 'tape measure', 'paper', 'pencil'],
    },
    {
      emoji: '🎯',
      title: 'Times Table Bingo',
      description: 'Make bingo cards with multiplication answers, then call out equations for each other to solve.',
      duration: '15 min',
      difficulty: 'Easy',
      color: 'from-blue-400 to-blue-600',
      calendarKey: 'Times+Table+Bingo',
      lessonLink: 'Multiplication',
      learningGoals: ['Recall multiplication facts quickly', 'Recognise products in different equation forms'],
      parentTip: 'If they can answer without counting, their times tables are solid!',
      icon: 'chef',
      materials: ['paper', 'pencil', 'counters or coins'],
    },
    {
      emoji: '🔷',
      title: 'Geometry Shape Hunt',
      description: 'Walk through the house finding real examples of triangles, quadrilaterals, and circles — photograph and label them.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-blue-400 to-blue-600',
      calendarKey: 'Geometry+Shape+Hunt',
      lessonLink: 'Geometry',
      learningGoals: ['Identify 2D shapes in the environment', 'Describe shape properties using correct vocabulary'],
      parentTip: 'Ask "How many sides and corners does it have?" to confirm understanding.',
      icon: 'map',
      materials: ['phone or tablet', 'paper', 'pencil'],
    },
    {
      emoji: '🪙',
      title: 'Money Jar Challenge',
      description: 'Tip out a jar of coins — count the total, make exact amounts, and practise giving change.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-blue-400 to-blue-600',
      calendarKey: 'Money+Jar+Challenge',
      lessonLink: 'Decimals & Money',
      learningGoals: ['Identify and count Australian coins and notes', 'Calculate change for simple purchases'],
      parentTip: 'Ask "If something costs $1.35 and you pay $2, what change do you get?"',
      icon: 'palette',
      materials: ['jar of coins', 'paper', 'pencil'],
    },
    {
      emoji: '🪙',
      title: 'Probability Coin Flip',
      description: 'Flip a coin 30 times, record heads vs. tails, then discuss whether results match predictions.',
      duration: '15 min',
      difficulty: 'Medium',
      color: 'from-blue-400 to-blue-600',
      calendarKey: 'Probability+Coin+Flip',
      lessonLink: 'Probability',
      learningGoals: ['Understand chance and likelihood', 'Record results and compare to predictions'],
      parentTip: 'Ask "Why didn\'t we get exactly 15 heads?" — this is a great discussion about probability.',
      icon: 'chef',
      materials: ['coin', 'tally chart', 'pencil'],
    },
    {
      emoji: '🔢',
      title: 'Number Pattern Detective',
      description: 'Spot number patterns on a calendar, staircase, or tiled floor — describe the rule and predict the next term.',
      duration: '10 min',
      difficulty: 'Easy',
      color: 'from-blue-400 to-blue-600',
      calendarKey: 'Number+Pattern+Detective',
      lessonLink: 'Patterns & Algebra',
      learningGoals: ['Identify and extend number patterns', 'Describe rules using mathematical language'],
      parentTip: 'If they can explain the rule in words, they\'re thinking algebraically!',
      icon: 'map',
      materials: ['calendar or notebook', 'pencil'],
    },
  ],
  Science: [
    {
      emoji: '🌱',
      title: 'Kitchen Garden Experiment',
      description: 'Grow beans in a jar — observe roots and shoots forming over days.',
      duration: '20 min setup',
      difficulty: 'Easy',
      color: 'from-green-400 to-emerald-500',
      calendarKey: 'Kitchen+Garden+Experiment',
      lessonLink: 'Living Things',
      learningGoals: ['Observe plant growth over time', 'Identify roots, stem, and leaves'],
      parentTip: 'Ask them to draw what they see each day — science journals build observation skills.',
      icon: 'chef',
      materials: ['glass jar', 'bean seeds', 'cotton wool', 'water'],
    },
    {
      emoji: '🧊',
      title: 'States of Matter Kitchen Lab',
      description: 'Observe ice melting and water boiling — record observations together.',
      duration: '15 min',
      difficulty: 'Easy',
      color: 'from-blue-400 to-cyan-500',
      calendarKey: 'States+of+Matter+Lab',
      lessonLink: 'States of Matter',
      learningGoals: ['Identify solid, liquid, gas states', 'Describe physical changes with evidence'],
      parentTip: 'Ask: "What would happen if we cooled the steam?" to push their thinking.',
      icon: 'map',
      materials: ['ice cubes', 'pot', 'water', 'notebook'],
    },
    {
      emoji: '🔦',
      title: 'Shadow Tracing',
      description: 'Trace shadows hourly to understand how the sun moves across the sky.',
      duration: '1 hr across day',
      difficulty: 'Medium',
      color: 'from-emerald-400 to-teal-500',
      calendarKey: 'Shadow+Tracing+Science',
      lessonLink: 'Earth & Space',
      learningGoals: ['Connect shadow changes to Earth\'s rotation', 'Record observations systematically'],
      parentTip: 'If they can predict where the shadow will be next, they understand it deeply!',
      icon: 'palette',
      materials: ['chalk', 'stick or object', 'outdoor space'],
    },
    {
      emoji: '🧲',
      title: 'Magnet Explorer',
      description: 'Test 10 household objects to see which are magnetic — record results in a two-column table.',
      duration: '15 min',
      difficulty: 'Easy',
      color: 'from-emerald-400 to-teal-500',
      calendarKey: 'Magnet+Explorer+Science',
      lessonLink: 'Forces & Materials',
      learningGoals: ['Classify materials as magnetic or non-magnetic', 'Record and communicate experimental results'],
      parentTip: 'Ask "Why do you think this one is/isn\'t magnetic?" to build scientific reasoning.',
      icon: 'chef',
      materials: ['fridge magnet', '10 household objects', 'paper', 'pencil'],
    },
    {
      emoji: '💧',
      title: 'Water Filter Challenge',
      description: 'Build a simple water filter using layers of sand, gravel, and cotton wool in a bottle — test how clear it makes muddy water.',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-emerald-400 to-teal-500',
      calendarKey: 'Water+Filter+Challenge',
      lessonLink: 'Earth & Environment',
      learningGoals: ['Understand filtration as a separation technique', 'Design and test a simple scientific model'],
      parentTip: 'Ask "Why is filtered water still not safe to drink?" — great critical thinking prompt.',
      icon: 'map',
      materials: ['plastic bottle', 'sand', 'gravel', 'cotton wool', 'muddy water', 'cup'],
    },
    {
      emoji: '🌋',
      title: 'Volcano Eruption',
      description: 'Build a paper-mâché or clay volcano and trigger an eruption with baking soda and vinegar — observe and describe the reaction.',
      duration: '45 min',
      difficulty: 'Easy',
      color: 'from-emerald-400 to-teal-500',
      calendarKey: 'Volcano+Eruption+Science',
      lessonLink: 'Chemical Changes',
      learningGoals: ['Observe a chemical reaction and describe evidence of change', 'Link the model to real-world geological processes'],
      parentTip: 'Ask "Is this a physical or chemical change?" — the bubbling gas is the key evidence.',
      icon: 'palette',
      materials: ['baking soda', 'vinegar', 'food colouring', 'clay or paper-mâché', 'tray'],
    },
    {
      emoji: '⚡',
      title: 'Static Electricity Lab',
      description: 'Rub a balloon on hair or a woollen jumper, then attract small pieces of paper or bend a stream of water — explore the invisible force.',
      duration: '10 min',
      difficulty: 'Easy',
      color: 'from-emerald-400 to-teal-500',
      calendarKey: 'Static+Electricity+Lab',
      lessonLink: 'Electricity & Energy',
      learningGoals: ['Understand that rubbing transfers electrical charge', 'Describe how charged objects attract neutral objects'],
      parentTip: 'Ask "Where else have you felt static electricity?" — makes the science personal.',
      icon: 'chef',
      materials: ['balloon', 'woollen jumper or hair', 'paper pieces', 'tap water'],
    },
    {
      emoji: '☁️',
      title: 'Cloud Journal',
      description: 'Observe and sketch cloud formations each day for a week — identify cumulus, stratus, and cirrus clouds.',
      duration: '10 min/day',
      difficulty: 'Easy',
      color: 'from-emerald-400 to-teal-500',
      calendarKey: 'Cloud+Journal+Science',
      lessonLink: 'Weather & Atmosphere',
      learningGoals: ['Identify common cloud types by appearance', 'Connect cloud types to weather patterns'],
      parentTip: 'Ask "What do you think the weather will be tomorrow based on today\'s clouds?" — building prediction skills.',
      icon: 'map',
      materials: ['notebook', 'pencil', 'coloured pencils'],
    },
  ],
  English: [
    {
      emoji: '✍️',
      title: 'Story Starter Jar',
      description: 'Write prompts on paper, pull one out, and write for 10 minutes without stopping.',
      duration: '10 min',
      difficulty: 'Easy',
      color: 'from-pink-400 to-rose-500',
      calendarKey: 'Story+Starter+Jar',
      lessonLink: 'Creative Writing',
      learningGoals: ['Practise narrative structure', 'Write fluently under time pressure'],
      parentTip: 'Don\'t correct during — encourage flow. Discuss choices afterwards.',
      icon: 'palette',
      materials: ['paper slips', 'jar or cup', 'pen', 'writing paper'],
    },
    {
      emoji: '📰',
      title: 'Family Newspaper',
      description: 'Write a short article about something that happened this week at home.',
      duration: '20 min',
      difficulty: 'Medium',
      color: 'from-slate-400 to-slate-600',
      calendarKey: 'Family+Newspaper',
      lessonLink: 'Informational Text',
      learningGoals: ['Write with a clear purpose and audience', 'Use journalistic structure: who/what/when/where'],
      parentTip: 'Ask "Who is your reader?" — audience awareness is a key writing skill.',
      icon: 'map',
      materials: ['paper', 'pen', 'pencils'],
    },
    {
      emoji: '🎙️',
      title: 'Persuasion Challenge',
      description: 'Give them 2 minutes to convince you of something — then discuss what worked.',
      duration: '10 min',
      difficulty: 'Easy',
      color: 'from-pink-400 to-rose-500',
      calendarKey: 'Persuasion+Challenge',
      lessonLink: 'Persuasive Writing',
      learningGoals: ['Use evidence and reasoning to persuade', 'Vary sentence types for effect'],
      parentTip: 'Ask: "What was your strongest argument?" — metacognition builds writing skills.',
      icon: 'chef',
      materials: [],
    },
    {
      emoji: '🎤',
      title: 'Book Review Podcast',
      description: 'Record a 2-minute spoken book review on your phone — include the title, plot summary, and a rating with reasons.',
      duration: '20 min',
      difficulty: 'Medium',
      color: 'from-pink-400 to-rose-500',
      calendarKey: 'Book+Review+Podcast',
      lessonLink: 'Reading & Speaking',
      learningGoals: ['Summarise a text with key details', 'Speak clearly with expression and structure'],
      parentTip: 'Ask them to listen back and identify one thing to improve — self-assessment is powerful.',
      icon: 'map',
      materials: ['phone or tablet for recording', 'completed book'],
    },
    {
      emoji: '📓',
      title: 'Word of the Day Journal',
      description: 'Learn one new word from the dictionary each day — write the definition, a synonym, and a sentence using it in context.',
      duration: '10 min',
      difficulty: 'Easy',
      color: 'from-pink-400 to-rose-500',
      calendarKey: 'Word+of+the+Day+Journal',
      lessonLink: 'Vocabulary',
      learningGoals: ['Expand vocabulary through direct instruction', 'Use new words in written and spoken sentences'],
      parentTip: 'Challenge them to use the word naturally in conversation during the day!',
      icon: 'palette',
      materials: ['notebook', 'pen', 'dictionary or dictionary app'],
    },
    {
      emoji: '🎭',
      title: 'Poetry Slam',
      description: 'Write a short poem on any topic — then perform it aloud with expression, pauses, and emphasis.',
      duration: '25 min',
      difficulty: 'Medium',
      color: 'from-pink-400 to-rose-500',
      calendarKey: 'Poetry+Slam+English',
      lessonLink: 'Poetry & Performance',
      learningGoals: ['Use poetic devices (rhyme, rhythm, imagery)', 'Perform with voice and expression'],
      parentTip: 'Ask "Why did you choose those words?" — explaining creative choices deepens understanding.',
      icon: 'chef',
      materials: ['paper', 'pen'],
    },
    {
      emoji: '🎤',
      title: 'Interview a Family Member',
      description: 'Prepare 5 questions, conduct a formal interview with a family member, then write a short profile article about them.',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-pink-400 to-rose-500',
      calendarKey: 'Interview+Family+Member',
      lessonLink: 'Informational Text',
      learningGoals: ['Write questions using journalistic who/what/when/where/why format', 'Transform spoken information into written text'],
      parentTip: 'Help them choose follow-up questions — "Tell me more about…" builds deeper interviews.',
      icon: 'map',
      materials: ['notepad', 'pen', 'willing family member'],
    },
    {
      emoji: '🔤',
      title: 'Family Spelling Bee',
      description: 'Take turns spelling words from the current school unit — grade the difficulty by adding definitions or usage in sentences.',
      duration: '15 min',
      difficulty: 'Easy',
      color: 'from-pink-400 to-rose-500',
      calendarKey: 'Family+Spelling+Bee',
      lessonLink: 'Spelling & Vocabulary',
      learningGoals: ['Recall correct spelling of curriculum vocabulary', 'Use new words in spoken sentences'],
      parentTip: 'If they hesitate, ask them to sound it out or think of a similar word — this is how good spellers self-correct.',
      icon: 'chef',
      materials: ['word list from school', 'pencil', 'paper for scoring'],
    },
  ],
  HSIE: [
    {
      emoji: '🗺️',
      title: 'Map Your Neighbourhood',
      description: 'Draw a map of your local area with landmarks, streets, and community features.',
      duration: '30 min',
      difficulty: 'Easy',
      color: 'from-teal-400 to-cyan-500',
      calendarKey: 'Map+Your+Neighbourhood',
      lessonLink: 'Maps & Place',
      learningGoals: ['Use a compass and map symbols', 'Identify community services and landmarks'],
      parentTip: 'Ask them to add a "map key" — this shows they understand how maps communicate.',
      icon: 'map',
      materials: ['paper', 'pencil', 'ruler', 'colours'],
    },
    {
      emoji: '📸',
      title: 'Community Photo Walk',
      description: 'Photograph things that show different community roles (post box, park, library).',
      duration: '45 min',
      difficulty: 'Easy',
      color: 'from-amber-400 to-yellow-500',
      calendarKey: 'Community+Photo+Walk',
      lessonLink: 'Community & Roles',
      learningGoals: ['Identify community roles and services', 'Connect places to their purpose'],
      parentTip: 'Ask: "Who uses this and why?" for each photo to build critical thinking.',
      icon: 'chef',
      materials: ['phone or camera'],
    },
    {
      emoji: '🌍',
      title: 'Country Research Box',
      description: 'Pick a country and find 5 interesting facts together using maps and books.',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-orange-400 to-amber-500',
      calendarKey: 'Country+Research+Box',
      lessonLink: 'World Geography',
      learningGoals: ['Research using multiple sources', 'Compare places and cultures'],
      parentTip: 'Ask them to find one similarity between that country and Australia.',
      icon: 'palette',
      materials: ['atlas or internet', 'paper', 'pen'],
    },
    {
      emoji: '📅',
      title: 'Family Timeline',
      description: 'Create a visual timeline of your family\'s history — include births, moves, and significant events.',
      duration: '30 min',
      difficulty: 'Easy',
      color: 'from-orange-400 to-amber-500',
      calendarKey: 'Family+Timeline+HSIE',
      lessonLink: 'History & Heritage',
      learningGoals: ['Sequence events chronologically', 'Connect personal history to broader social history'],
      parentTip: 'Share stories from before they were born — this brings history to life personally.',
      icon: 'chef',
      materials: ['large paper', 'pencil', 'coloured markers', 'family photos (optional)'],
    },
    {
      emoji: '🚢',
      title: 'Trade Routes Game',
      description: 'Pick 5 household items and trace where each was made — mark them on a world map to see global trade in action.',
      duration: '25 min',
      difficulty: 'Medium',
      color: 'from-orange-400 to-amber-500',
      calendarKey: 'Trade+Routes+Game',
      lessonLink: 'Economics & Globalisation',
      learningGoals: ['Understand global supply chains and trade', 'Use maps to show movement of goods'],
      parentTip: 'Ask "Why are so many things made in other countries?" — sparks great discussion.',
      icon: 'map',
      materials: ['world map or atlas', 'coloured stickers or pen', '5 household items to check labels'],
    },
    {
      emoji: '🍜',
      title: 'Cultural Food Night',
      description: 'Choose a country from HSIE class, cook or prepare a traditional dish together, and learn 3 facts about that food culture.',
      duration: '1 hr',
      difficulty: 'Medium',
      color: 'from-orange-400 to-amber-500',
      calendarKey: 'Cultural+Food+Night',
      lessonLink: 'Culture & Diversity',
      learningGoals: ['Connect food traditions to cultural identity', 'Research and present cultural information'],
      parentTip: 'Ask "What does this food tell us about the climate or history of that place?"',
      icon: 'palette',
      materials: ['recipe ingredients', 'device for research'],
    },
    {
      emoji: '🏛️',
      title: 'Government Roles Poster',
      description: 'Research Australia\'s three levels of government — local, state, federal — and create a poster explaining who does what.',
      duration: '35 min',
      difficulty: 'Medium',
      color: 'from-orange-400 to-amber-500',
      calendarKey: 'Government+Roles+Poster',
      lessonLink: 'Civics & Citizenship',
      learningGoals: ['Identify the roles of local, state, and federal governments', 'Present information clearly in a visual format'],
      parentTip: 'Ask "Which level of government fixed our local road?" — connects learning to daily life.',
      icon: 'chef',
      materials: ['large paper', 'coloured markers', 'internet for research'],
    },
    {
      emoji: '🌡️',
      title: 'Climate Zone Compare',
      description: 'Compare temperature and rainfall data from 3 Australian cities — create a simple graph and explain what makes each climate zone different.',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-orange-400 to-amber-500',
      calendarKey: 'Climate+Zone+Compare',
      lessonLink: 'Geography & Environment',
      learningGoals: ['Read and create basic climate graphs', 'Compare geographic regions using evidence'],
      parentTip: 'Ask "Why does Darwin get so much more rain than Adelaide?" — connects geography to climate.',
      icon: 'map',
      materials: ['graph paper', 'coloured pencils', 'device for weather data'],
    },
  ],
  'Creative Arts': [
    {
      emoji: '🖌️',
      title: 'Watercolour Wash Sunset',
      description: 'Practice blending colours to create a gradient sky — wet-on-wet technique.',
      duration: '25 min',
      difficulty: 'Easy',
      color: 'from-orange-400 to-pink-500',
      calendarKey: 'Watercolour+Sunset',
      lessonLink: 'Colour & Visual Arts',
      learningGoals: ['Mix primary colours to make secondary colours', 'Apply wet-on-wet painting technique'],
      parentTip: 'Ask: "Why did those two colours blend that way?" — colour theory in action.',
      icon: 'palette',
      materials: ['watercolour paints', 'paintbrush', 'paper', 'water cup'],
    },
    {
      emoji: '🎵',
      title: 'Rhythm Clapping Game',
      description: 'Clap patterns and challenge each other to listen, remember, and repeat them.',
      duration: '10 min',
      difficulty: 'Easy',
      color: 'from-violet-400 to-indigo-500',
      calendarKey: 'Rhythm+Clapping+Game',
      lessonLink: 'Music & Rhythm',
      learningGoals: ['Recognise and replicate rhythm patterns', 'Develop steady beat and timing'],
      parentTip: 'Try increasing complexity — if they can copy a 6-beat pattern, that\'s excellent!',
      icon: 'chef',
      materials: [],
    },
    {
      emoji: '🎭',
      title: 'Mini Play',
      description: 'Act out a favourite story scene together — swap roles and try different emotions.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-purple-400 to-violet-500',
      calendarKey: 'Mini+Play+Drama',
      lessonLink: 'Drama & Performance',
      learningGoals: ['Use voice and body to convey emotion', 'Understand character perspective'],
      parentTip: 'Ask: "How would the villain say that line?" — perspective-taking is key in drama.',
      icon: 'map',
      materials: ['costumes or props (optional)'],
    },
    {
      emoji: '✂️',
      title: 'Collage Self-Portrait',
      description: 'Cut images, colours, and patterns from old magazines to build a creative self-portrait that reflects personality.',
      duration: '30 min',
      difficulty: 'Easy',
      color: 'from-purple-400 to-violet-500',
      calendarKey: 'Collage+Self+Portrait',
      lessonLink: 'Visual Arts',
      learningGoals: ['Use composition to create visual interest', 'Make creative choices about colour, texture, and shape'],
      parentTip: 'Ask "Why did you choose that image?" — helps them articulate artistic intent.',
      icon: 'palette',
      materials: ['old magazines', 'scissors', 'glue stick', 'A3 paper'],
    },
    {
      emoji: '🎵',
      title: 'Soundscape Recording',
      description: 'Go outside for 5 minutes and record natural sounds — birds, wind, water. Layer them into a 30-second soundscape using a free app.',
      duration: '25 min',
      difficulty: 'Medium',
      color: 'from-purple-400 to-violet-500',
      calendarKey: 'Soundscape+Recording',
      lessonLink: 'Music & Sound',
      learningGoals: ['Explore environmental sounds as musical material', 'Make deliberate choices about layering and composition'],
      parentTip: 'Ask "How does this sound make you feel?" — connects music to emotional response.',
      icon: 'chef',
      materials: ['phone with voice recorder or GarageBand', 'outdoor space'],
    },
    {
      emoji: '💃',
      title: 'Dance Sequence',
      description: 'Create a 16-beat dance routine using 4 different movements — practise, then perform it for the family.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-purple-400 to-violet-500',
      calendarKey: 'Dance+Sequence',
      lessonLink: 'Dance & Movement',
      learningGoals: ['Sequence movements to create a structured performance', 'Use beat, timing, and expression in movement'],
      parentTip: 'Count the beats aloud together — this connects music theory to physical movement.',
      icon: 'map',
      materials: ['music playlist', 'open floor space'],
    },
    {
      emoji: '🍎',
      title: 'Still Life Sketch',
      description: 'Arrange a bowl of fruit or vegetables, then sketch it focusing on shape, shading, and proportion.',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-purple-400 to-violet-500',
      calendarKey: 'Still+Life+Sketch',
      lessonLink: 'Drawing & Observation',
      learningGoals: ['Observe and draw from life with attention to proportion', 'Use shading to show light and depth'],
      parentTip: 'Ask them to squint at the object — squinting simplifies shapes and helps beginners see light/dark.',
      icon: 'palette',
      materials: ['bowl of fruit', 'pencil', 'drawing paper', 'eraser'],
    },
    {
      emoji: '🎪',
      title: 'Puppet Show',
      description: 'Create paper bag or sock puppets together, write a short 3-scene script, then perform it for the family.',
      duration: '40 min',
      difficulty: 'Easy',
      color: 'from-purple-400 to-violet-500',
      calendarKey: 'Puppet+Show+Arts',
      lessonLink: 'Drama & Visual Arts',
      learningGoals: ['Design and make a simple puppet using craft materials', 'Script and perform a short narrative sequence'],
      parentTip: 'Ask "How does your puppet feel in this scene?" — character motivation makes performances richer.',
      icon: 'chef',
      materials: ['paper bags or old socks', 'googly eyes', 'glue', 'markers', 'fabric scraps'],
    },
  ],
  PE: [
    {
      emoji: '⏱️',
      title: 'Backyard Obstacle Course',
      description: 'Set up a timed course with hula hoops, cones, and jumps — record your best time!',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-lime-400 to-green-500',
      calendarKey: 'Backyard+Obstacle+Course',
      lessonLink: 'Movement & Agility',
      learningGoals: ['Develop agility and spatial awareness', 'Practise timing and self-assessment'],
      parentTip: 'Ask them to redesign the course to make it harder — builds creative thinking too.',
      icon: 'map',
      materials: ['hula hoops', 'cones', 'stopwatch or phone'],
    },
    {
      emoji: '🎯',
      title: 'Target Throwing',
      description: 'Throw beanbags at chalk circles from different distances — record your accuracy.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-red-400 to-orange-500',
      calendarKey: 'Target+Throwing+PE',
      lessonLink: 'Ball Skills',
      learningGoals: ['Develop overarm and underarm throwing technique', 'Practise self-monitoring'],
      parentTip: 'Ask them to describe their technique — articulating movement builds skill transfer.',
      icon: 'chef',
      materials: ['beanbags or soft balls', 'chalk', 'paper to record scores'],
    },
    {
      emoji: '🚴',
      title: 'Bike Ride Challenge',
      description: 'Set a distance goal and track it on a map app — plan the route together.',
      duration: '45 min',
      difficulty: 'Medium',
      color: 'from-red-400 to-rose-500',
      calendarKey: 'Bike+Ride+Challenge',
      lessonLink: 'Endurance & Fitness',
      learningGoals: ['Build cardiovascular endurance', 'Practise goal-setting and effort pacing'],
      parentTip: 'Ask: "How did you know when to push harder and when to rest?" — pacing awareness.',
      icon: 'palette',
      materials: ['bicycle', 'helmet', 'phone for map app'],
    },
    {
      emoji: '🧘',
      title: 'Kids Yoga Flow',
      description: 'Follow a 10-minute guided kids yoga video together — focus on breathing, balance, and body awareness.',
      duration: '10 min',
      difficulty: 'Easy',
      color: 'from-red-400 to-rose-500',
      calendarKey: 'Kids+Yoga+Flow',
      lessonLink: 'Health & Wellbeing',
      learningGoals: ['Practise controlled breathing and relaxation techniques', 'Develop flexibility and body awareness'],
      parentTip: 'Ask "How does your body feel different after?" — builds mindfulness vocabulary.',
      icon: 'chef',
      materials: ['yoga mat or carpet', 'device for video'],
    },
    {
      emoji: '🪢',
      title: 'Jump Rope Challenge',
      description: 'Count personal best skips in 30 seconds — try different techniques and record improvement over a week.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-red-400 to-rose-500',
      calendarKey: 'Jump+Rope+Challenge',
      lessonLink: 'Coordination & Fitness',
      learningGoals: ['Develop skipping rhythm and timing', 'Set personal goals and track progress'],
      parentTip: 'Ask "What changed when you improved?" — helps them notice what good technique feels like.',
      icon: 'map',
      materials: ['jump rope', 'stopwatch or phone', 'notebook to record results'],
    },
    {
      emoji: '🦅',
      title: 'Balancing Act Circuit',
      description: 'Create 4 balance stations using pillows, a low beam, or a line of tape — time how long you can hold each pose.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-red-400 to-rose-500',
      calendarKey: 'Balancing+Act+Circuit',
      lessonLink: 'Balance & Coordination',
      learningGoals: ['Develop static and dynamic balance', 'Understand how body position affects stability'],
      parentTip: 'Ask "What helps you balance better?" — arms out, eyes fixed, one breath at a time.',
      icon: 'palette',
      materials: ['tape or chalk line', 'pillows or cushions', 'stopwatch'],
    },
    {
      emoji: '📱',
      title: 'Skills Video Review',
      description: 'Film yourself performing 3 sport skills (e.g., throw, catch, kick) — watch back and identify one improvement for each.',
      duration: '25 min',
      difficulty: 'Medium',
      color: 'from-red-400 to-rose-500',
      calendarKey: 'Skills+Video+Review',
      lessonLink: 'Movement Skills',
      learningGoals: ['Self-evaluate movement technique by watching video', 'Set specific targets for skill improvement'],
      parentTip: 'Ask "What did you notice that you couldn\'t feel while doing it?" — video builds body awareness.',
      icon: 'chef',
      materials: ['phone or tablet for video', 'ball or equipment for chosen skill', 'outdoor space'],
    },
    {
      emoji: '🏃',
      title: 'Backyard Relay',
      description: 'Set up a relay course around the garden — run laps, tag a family member, and compete for the fastest team time.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-red-400 to-rose-500',
      calendarKey: 'Backyard+Relay+Race',
      lessonLink: 'Team Sports & Fitness',
      learningGoals: ['Develop running speed and team coordination', 'Understand relay race rules and baton technique'],
      parentTip: 'Ask "How could we improve our handover?" — teamwork and strategy make this more than just running.',
      icon: 'map',
      materials: ['baton or object to pass', 'cones or markers', 'stopwatch'],
    },
  ],
}

function openCalendar(title: string) {
  const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&details=Learning+activity+from+Srenniw`
  window.open(url, '_blank')
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function DaySubjectPage({ params }: { params: Promise<{ date: string; subject: string }> }) {
  const { date, subject: subjectEncoded } = use(params)
  const subject = decodeURIComponent(subjectEncoded)
  const router = useRouter()

  const schedule = getScheduleForDate(date)
  const subjectEntry = schedule.find(s => s.subject === subject)
  const quickPeek = subjectEntry ? getQuickPeekForSchedule(subject, subjectEntry.topic) : null

  const subjectIndex = schedule.findIndex(s => s.subject === subject)
  const prevSubject = subjectIndex > 0 ? schedule[subjectIndex - 1] : null
  const nextSubject = subjectIndex < schedule.length - 1 ? schedule[subjectIndex + 1] : null

  const [activeTab, setActiveTab] = useState<TabId>('journey')
  const [promptIndex, setPromptIndex] = useState(0)
  const [crossSubjectIndex, setCrossSubjectIndex] = useState(() => Math.floor(Math.random() * 8))
  const [crossSubjectVisible, setCrossSubjectVisible] = useState(true)
  const [activityPage, setActivityPage] = useState(0)
  const [pageFade, setPageFade] = useState(true)
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false)

  // Journal state
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null)
  const [timeSpent, setTimeSpent] = useState(30)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const color = SUBJECT_COLORS[subject as SubjectName] ?? '#94a3b8'
  const bgColor = SUBJECT_BG_COLORS[subject as SubjectName] ?? '#f8fafc'
  const emoji = SUBJECT_EMOJIS[subject as SubjectName] ?? '📚'

  const prompts = SUBJECT_PROMPTS[subject] ?? SUBJECT_PROMPTS['Maths']
  const activityCards = ACTIVITY_CARDS[subject] ?? ACTIVITY_CARDS['Maths']
  const currentPrompt = prompts[promptIndex]
  const MomentIcon = MOMENT_ICONS[currentPrompt.icon]

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveJournal = async () => {
    if (selectedLevel === null || selectedEmotion === null) {
      showToast('Please select understanding level and mood.')
      return
    }
    setIsSaving(true)
    try {
      const emotionLabel = EMOTIONS.find(e => e.id === selectedEmotion)?.label ?? ''
      saveJournalEntry({
        date: getTodayDate(),
        timestamp: Date.now(),
        cognitiveLevel: selectedLevel,
        emotion: emotionLabel,
        subject,
        timeSpent,
        notes,
      })
      showToast('Journal saved! ✨')
      setSelectedLevel(null)
      setSelectedEmotion(null)
      setNotes('')
    } catch {
      showToast('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!subjectEntry || !quickPeek) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No schedule found for {subject} on {date}.</p>
        <button onClick={() => router.push('/parent')} className="mt-4 text-sm text-blue-500 underline">
          ← Back to Calendar
        </button>
      </div>
    )
  }

  /* ─── Tab content renderers ── */

  const renderNavigation = () => (
    <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 shrink-0">
      <button
        onClick={() => prevSubject && router.push(`/parent/day/${date}/${encodeURIComponent(prevSubject.subject)}`)}
        disabled={!prevSubject}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${prevSubject ? 'text-indigo-600 hover:bg-slate-50' : 'opacity-0 pointer-events-none'
          }`}
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Previous Subject</span>
      </button>

      <div className="text-slate-500 font-medium text-sm">
        Subject {subjectIndex + 1} of {schedule.length}
      </div>

      <button
        onClick={() => nextSubject && router.push(`/parent/day/${date}/${encodeURIComponent(nextSubject.subject)}`)}
        disabled={!nextSubject}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${nextSubject ? 'text-indigo-600 hover:bg-slate-50' : 'opacity-0 pointer-events-none'
          }`}
      >
        <span className="hidden sm:inline">Next Subject</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )

  const renderJourney = () => (
    <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-12 font-sans overflow-x-hidden text-slate-800">
      {/* Main content panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* The Trailer */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 mb-6 lg:mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-50 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 shrink-0">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-wider rounded-full">
              {subject}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                ✨ The 60-Second Summary
              </h3>
            </div>
          </div>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-medium mt-2">
            {quickPeek.essence_text}
          </p>
          <div className="mt-6 p-5 bg-indigo-50/70 rounded-2xl border border-indigo-100/50">
            <span className="font-bold text-indigo-900 block mb-1">Real-world example:</span>
            <p className="italic text-slate-700 leading-relaxed">
              {quickPeek.relatable_example}
            </p>
          </div>
        </div>

        {/* The Deep Dive */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
            🚀 Dive Deeper
          </h3>
          <Accordion type="single" collapsible className="w-full space-y-4">

            {quickPeek.core_concept && (
              <AccordionItem
                value="core-concept"
                className="border border-slate-100 rounded-2xl px-5 data-[state=open]:bg-slate-50/50 data-[state=open]:border-slate-200 transition-all duration-300"
              >
                <AccordionTrigger className="text-lg font-bold text-slate-800 hover:text-indigo-600 hover:no-underline py-4 text-left">
                  Core Concept
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-5">
                  {quickPeek.core_concept}
                </AccordionContent>
              </AccordionItem>
            )}

            {quickPeek.key_vocabulary && Object.keys(quickPeek.key_vocabulary).length > 0 && (
              <AccordionItem
                value="key-vocabulary"
                className="border border-slate-100 rounded-2xl px-5 data-[state=open]:bg-slate-50/50 data-[state=open]:border-slate-200 transition-all duration-300"
              >
                <AccordionTrigger className="text-lg font-bold text-slate-800 hover:text-indigo-600 hover:no-underline py-4 text-left">
                  Key Vocabulary
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-5">
                  <ul className="space-y-3">
                    {Object.entries(quickPeek.key_vocabulary).map(([term, def], idx) => (
                      <li key={idx} className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <span className="font-bold text-slate-800 shrink-0">{term}:</span>
                        <span className="text-slate-600">{def as string}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {quickPeek.why_this_matters && (
              <AccordionItem
                value="why-this-matters"
                className="border border-slate-100 rounded-2xl px-5 data-[state=open]:bg-slate-50/50 data-[state=open]:border-slate-200 transition-all duration-300"
              >
                <AccordionTrigger className="text-lg font-bold text-slate-800 hover:text-indigo-600 hover:no-underline py-4 text-left">
                  Why This Matters
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-5">
                  {quickPeek.why_this_matters}
                </AccordionContent>
              </AccordionItem>
            )}

          </Accordion>
        </div>

        {/* Afterclass Practice Panel */}
        <button
          onClick={() => setIsPracticeModalOpen(true)}
          className="bg-white rounded-3xl p-6 sm:p-8 mt-6 lg:mt-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 shrink-0 text-left hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-700">
              📝 Afterclass Practice
            </h3>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {renderNavigation()}
      </div>

      {/* Right: TikTok panel — always shown */}
      <div className="w-full lg:w-[400px] shrink-0 lg:pt-4 pb-12">
        <TikTokHookPanel videos={quickPeek.videos.length > 1 ? quickPeek.videos : [
          "/samples/sample1.mp4",
          "/samples/sample2.mp4",
          "/samples/sample3.mp4",
          "/samples/sample4.mp4",
          "/samples/sample5.mp4"
        ]} />
      </div>
    </div>
  )

  const CROSS_SUBJECT_ACTIVITIES = [
    {
      title: 'Cooking Math & Science',
      description: 'Follow a recipe together — measure ingredients (fractions!), observe chemical changes as you cook, and write a short review of the dish.',
      subjects: [{ emoji: '🔢', name: 'Maths' }, { emoji: '🔬', name: 'Science' }, { emoji: '✍️', name: 'English' }],
      materials: ['recipe', 'measuring cups', 'ingredients', 'pen & paper'],
      gradient: 'from-orange-400 to-rose-400',
    },
    {
      title: 'Story Map Explorer',
      description: "Draw a map of your favourite book's setting, label locations, add a compass rose, and write 3 sentences about why the setting matters to the story.",
      subjects: [{ emoji: '📖', name: 'English' }, { emoji: '🗺️', name: 'HSIE' }, { emoji: '🎨', name: 'Creative Arts' }],
      materials: ['large paper', 'coloured pencils', 'ruler', 'favourite book'],
      gradient: 'from-blue-400 to-indigo-500',
    },
    {
      title: 'Nature Journal',
      description: 'Go outside for 15 minutes. Sketch 3 things you observe — a plant, an insect, and a cloud. Write one scientific fact about each.',
      subjects: [{ emoji: '🔬', name: 'Science' }, { emoji: '🎨', name: 'Creative Arts' }, { emoji: '✍️', name: 'English' }],
      materials: ['notebook', 'pencil', 'coloured pencils'],
      gradient: 'from-green-400 to-teal-500',
    },
    {
      title: 'Budget Planner',
      description: "Pretend you have $50 for a family day out. Research costs online, add them up, and present your plan — staying within budget!",
      subjects: [{ emoji: '🔢', name: 'Maths' }, { emoji: '🗺️', name: 'HSIE' }, { emoji: '✍️', name: 'English' }],
      materials: ['pen & paper', 'device for research'],
      gradient: 'from-yellow-400 to-amber-500',
    },
    {
      title: 'Weather Reporter',
      description: 'Check the forecast for 5 cities around the world. Record temperatures, create a bar graph, and record a 60-second weather report video.',
      subjects: [{ emoji: '🔬', name: 'Science' }, { emoji: '🔢', name: 'Maths' }, { emoji: '🗺️', name: 'HSIE' }],
      materials: ['graph paper', 'coloured pencils', 'phone or tablet'],
      gradient: 'from-sky-400 to-blue-500',
    },
    {
      title: 'Fraction Pizza',
      description: 'Design your dream pizza on paper divided into 8 equal slices. Use fractions to describe each topping group, then write a persuasive menu description.',
      subjects: [{ emoji: '🔢', name: 'Maths' }, { emoji: '✍️', name: 'English' }, { emoji: '🎨', name: 'Creative Arts' }],
      materials: ['paper', 'coloured pencils', 'ruler'],
      gradient: 'from-red-400 to-orange-400',
    },
    {
      title: 'Indigenous Plant Map',
      description: 'Research 3 plants native to your local area. Draw each plant, label its parts, and write a sentence about how it was used by First Nations peoples.',
      subjects: [{ emoji: '🔬', name: 'Science' }, { emoji: '🗺️', name: 'HSIE' }, { emoji: '🎨', name: 'Creative Arts' }],
      materials: ['paper', 'coloured pencils', 'device for research'],
      gradient: 'from-emerald-400 to-green-600',
    },
    {
      title: 'Sports Stats Analyst',
      description: "Pick your favourite sport. Record stats from a recent match (goals, points, time played). Calculate averages and create a poster summarising your findings.",
      subjects: [{ emoji: '🔢', name: 'Maths' }, { emoji: '⚽', name: 'PE' }, { emoji: '✍️', name: 'English' }],
      materials: ['pen & paper', 'ruler', 'coloured pencils'],
      gradient: 'from-violet-400 to-purple-600',
    },
  ]

  const handleCrossSubjectShuffle = () => {
    setCrossSubjectVisible(false)
    setTimeout(() => {
      setCrossSubjectIndex(prev => {
        let next = Math.floor(Math.random() * (CROSS_SUBJECT_ACTIVITIES.length - 1))
        if (next >= prev) next++
        return next
      })
      setCrossSubjectVisible(true)
    }, 200)
  }

  const renderActivity = () => (
    <div className="space-y-6">
      {/* Review Prompt Carousel */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-violet-200 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">💬 Try this today</h3>
            <span className="text-slate-300">|</span>
            <Badge variant="secondary" className="bg-white/80 text-slate-600 border-none text-xs font-medium shadow-sm">
              <MomentIcon className="w-3 h-3 mr-1" />
              {currentPrompt.moment}
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none text-xs font-medium">
              <GraduationCap className="w-3 h-3 mr-1" />
              {currentPrompt.topic}
            </Badge>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-xs font-medium">
              <Clock className="w-3 h-3 mr-1" />
              {currentPrompt.timeNeeded}
            </Badge>
          </div>
          <span className="text-xs text-slate-400 font-medium tabular-nums hidden sm:block">
            {promptIndex + 1} / {prompts.length}
          </span>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-start sm:items-center px-6 py-5">
          <div className="bg-white p-3.5 rounded-full shadow-sm text-amber-500 shrink-0">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div className="flex-1 space-y-2.5 min-w-0">
            <p className="text-xl sm:text-2xl font-medium text-slate-800 leading-tight">
              {currentPrompt.prompt}
            </p>
            <p className="text-sm text-blue-600 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span><span className="font-medium">Review goal:</span> {currentPrompt.reviewGoal}</span>
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 bg-white hover:bg-slate-50 border-blue-200 text-blue-700 self-end sm:self-center"
            onClick={() => setPromptIndex(p => (p + 1) % prompts.length)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Shuffle
          </Button>
        </div>

        <div className="relative z-10 flex justify-center gap-1.5 pb-4">
          {prompts.map((_, i) => (
            <button
              key={i}
              onClick={() => setPromptIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === promptIndex ? 'bg-blue-500 w-5' : 'bg-blue-200 hover:bg-blue-300'
                }`}
              aria-label={`Go to prompt ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Activity Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Let&apos;s Do This! 🎯</h2>
          <p className="text-slate-500 text-sm mt-0.5">AI-matched ideas based on what&apos;s being learned this week</p>
        </div>

        {(() => {
          const CARDS_PER_PAGE = 4
          const totalPages = Math.ceil(activityCards.length / CARDS_PER_PAGE)
          const displayedCards = activityCards.slice(activityPage * CARDS_PER_PAGE, (activityPage + 1) * CARDS_PER_PAGE)

          const changePage = (newPage: number) => {
            setPageFade(false)
            setTimeout(() => {
              setActivityPage(newPage)
              setPageFade(true)
            }, 150)
          }

          const difficultyClass = (difficulty: string) => {
            if (difficulty === 'Easy') return 'bg-green-100 text-green-700'
            if (difficulty === 'Medium') return 'bg-yellow-100 text-yellow-700'
            if (difficulty === 'Hard') return 'bg-red-100 text-red-700'
            return 'bg-slate-100 text-slate-600'
          }

          return (
            <>
              <div className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${pageFade ? 'opacity-100' : 'opacity-0'}`}>
                {displayedCards.map((activity, i) => {
                  const globalIndex = activityPage * CARDS_PER_PAGE + i
                  const cardGradient = PASTEL_CARD_GRADIENTS[globalIndex % 8]
                  return (
                    <div key={i} className="rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col bg-white border border-slate-100">
                      {/* TOP: pastel gradient section */}
                      <div className={`bg-gradient-to-br ${cardGradient} relative flex flex-col items-center justify-center px-4 py-7`}>
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full bg-white/20 text-white border border-white/30 text-xs px-3 py-1 font-medium">
                            {activity.lessonLink}
                          </span>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-4xl shadow-sm">
                          {activity.emoji}
                        </div>
                      </div>

                      {/* BOTTOM: white section */}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-800 leading-snug">{activity.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{activity.description}</p>

                        <p className="text-xs uppercase tracking-widest text-gray-400 mt-3 mb-1.5">What your child will practise</p>
                        <div className="space-y-1">
                          {activity.learningGoals.map((goal, gi) => (
                            <p key={gi} className="text-sm text-slate-600 flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                              {goal}
                            </p>
                          ))}
                        </div>

                        <div className="bg-amber-50 rounded-xl p-3 mt-3">
                          <p className="text-xs text-amber-800 flex items-start gap-1.5">
                            <span className="shrink-0 mt-0.5">👁️</span>
                            <span><strong>What to look for:</strong> {activity.parentTip}</span>
                          </p>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyClass(activity.difficulty)}`}>
                              {activity.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              {activity.duration}
                            </span>
                          </div>
                          <button
                            onClick={() => openCalendar(activity.calendarKey)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            Add to Calendar 📅
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-1">
                  <button
                    onClick={() => changePage(Math.max(0, activityPage - 1))}
                    disabled={activityPage === 0}
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {Array.from({ length: totalPages }).map((_, pi) => (
                        <button
                          key={pi}
                          onClick={() => changePage(pi)}
                          className={`rounded-full transition-all ${pi === activityPage ? 'w-5 h-2 bg-slate-700' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'}`}
                          aria-label={`Page ${pi + 1}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums">{activityPage + 1}/{totalPages}</span>
                  </div>
                  <button
                    onClick={() => changePage(Math.min(totalPages - 1, activityPage + 1))}
                    disabled={activityPage === totalPages - 1}
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )
        })()}
      </section>

      {/* 🔀 Mix It Up! */}
      <section>
        <h2 className="text-base font-bold text-slate-800 mb-3">🔀 Mix It Up!</h2>
        {(() => {
          const cx = CROSS_SUBJECT_ACTIVITIES[crossSubjectIndex]
          return (
            <div
              className={`relative rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br ${cx.gradient} transition-opacity duration-200 ${crossSubjectVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 p-7 text-white">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-bold leading-snug">{cx.title}</h3>
                  <button
                    onClick={handleCrossSubjectShuffle}
                    className="shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center"
                    aria-label="Shuffle activity"
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-sm text-white/90 mb-5 leading-relaxed max-w-xl">{cx.description}</p>

                {/* Subject badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {cx.subjects.map((s, si) => (
                    <span key={si} className="flex items-center gap-1 rounded-full bg-white/20 text-xs px-3 py-1 font-medium">
                      {s.emoji} {s.name}
                    </span>
                  ))}
                </div>

                {/* Materials */}
                <div>
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">You&apos;ll need</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cx.materials.map((m, mi) => (
                      <span key={mi} className="rounded-full bg-white/20 text-xs px-2 py-1 text-white/90">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </section>
    </div>
  )

  const renderJournal = () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">How did this lesson go?</p>
      </div>

      <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg p-5 space-y-7">
        {/* Understanding level */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Understanding Level</h3>
          <div className="grid grid-cols-5 gap-2 relative">
            <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-slate-100 z-0 rounded-full hidden sm:block" />
            {selectedLevel !== null && (
              <div
                className="absolute top-5 left-[10%] h-1 bg-blue-500 z-0 rounded-full transition-all duration-300 hidden sm:block"
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
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border-2
                        ${isActive ? 'bg-blue-500 border-blue-500 text-white scale-110 shadow-md'
                        : isPast ? 'bg-blue-50 border-blue-400 text-blue-500'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    {level.id}
                  </button>
                  <span className={`text-[10px] mt-2 font-medium text-center transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500'}`}>
                    {level.label}
                  </span>
                </div>
              )
            })}
          </div>
          {selectedLevel !== null && (
            <p className="text-xs font-medium text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              <span className="text-blue-500 font-bold mr-1">{COGNITIVE_LEVELS[selectedLevel - 1].label}:</span>
              {COGNITIVE_LEVELS[selectedLevel - 1].desc}
            </p>
          )}
        </div>

        <div className="h-px bg-slate-100" />

        {/* Mood */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">How was the mood?</h3>
          <div className="flex justify-between">
            {EMOTIONS.map(emotion => (
              <button
                key={emotion.id}
                onClick={() => setSelectedEmotion(emotion.id)}
                className={`flex flex-col items-center py-2 rounded-2xl transition-all duration-200 w-16
                    ${selectedEmotion === emotion.id ? 'bg-orange-50 ring-2 ring-orange-400 scale-105 shadow-sm' : 'hover:bg-slate-50'}`}
              >
                <span className="text-4xl mb-1">{emotion.emoji}</span>
                <span className={`text-[10px] font-medium ${selectedEmotion === emotion.id ? 'text-orange-600' : 'text-slate-500'}`}>
                  {emotion.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Time spent */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Time spent</h3>
            <span className="text-xl font-bold text-emerald-600">{timeSpent} min</span>
          </div>
          <input
            type="range"
            min={0}
            max={120}
            step={5}
            value={timeSpent}
            onChange={e => setTimeSpent(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>0 min</span>
            <span>30</span>
            <span>60</span>
            <span>90</span>
            <span>120 min</span>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Notes */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700">Observations (optional)</h3>
          <Textarea
            placeholder={`E.g., They loved the ${subjectEntry.topic} activity today!`}
            className="resize-none h-20 bg-slate-50 border-slate-200 text-sm"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <Button
          className="w-full h-12 text-base font-semibold rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all active:scale-[0.98]"
          onClick={handleSaveJournal}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : '💾 Save Journal Entry'}
        </Button>
      </div>
    </div>
  )

  /* ─── Layout ── */

  const WEEK_DAYS = [
    { name: 'Monday',    date: '2026-04-06' },
    { name: 'Tuesday',   date: '2026-04-07' },
    { name: 'Wednesday', date: '2026-04-08' },
    { name: 'Thursday',  date: '2026-04-09' },
    { name: 'Friday',    date: '2026-04-10' },
  ]

  const currentDayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-89px)] bg-slate-50/30">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Main Container for Header and Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
        
        {/* Top Navigation Row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-8 gap-y-6">
          {/* Left: Back Button */}
          <div className="w-auto sm:w-1/4 flex justify-start order-1">
            <button
              onClick={() => router.push('/parent')}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft size={16} />
              <span className="hidden lg:inline">Back to Calendar</span>
              <span className="inline lg:hidden">Back</span>
            </button>
          </div>

          {/* Center: Horizontal 5-Day Calendar */}
          <div className="w-full sm:w-2/4 order-3 sm:order-2 px-2 sm:px-6">
            <div className="flex items-center justify-between w-full relative max-w-md mx-auto">
              {WEEK_DAYS.map((dayObj, idx) => {
                const isActive = currentDayName === dayObj.name
                const isLast = idx === WEEK_DAYS.length - 1
                const dayIndex = WEEK_DAYS.findIndex(d => d.name === currentDayName)
                const isPast = dayIndex >= idx

                return (
                  <div key={dayObj.name} className={`flex items-center ${!isLast ? 'flex-1' : ''}`}>
                    <div 
                      className="relative flex flex-col items-center group cursor-pointer"
                      onClick={() => {
                          const nextSchedule = getScheduleForDate(dayObj.date)
                          if (nextSchedule.length > 0) {
                              router.push(`/parent/day/${dayObj.date}/${encodeURIComponent(nextSchedule[0].subject)}`)
                          }
                      }}
                    >
                      <div 
                         className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs transition-all duration-300 z-10 relative
                           ${isActive 
                             ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-100 scale-110' 
                             : isPast 
                                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                                : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-300 hover:text-indigo-500'}`}
                      >
                         {dayObj.name.slice(0, 3)}
                      </div>
                    </div>

                    {/* Connecting Line */}
                    {!isLast && (
                      <div className="flex-1 h-0.5 mx-1 sm:mx-2 rounded-full bg-slate-100 relative overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-500"
                          style={{ width: isPast && dayIndex > idx ? '100%' : '0%' }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Right: Subject Badge */}
          <div className="w-auto sm:w-1/4 flex justify-end order-2 sm:order-3">
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-white/50"
              style={{ background: bgColor, color }}
            >
              <span>{emoji}</span>
              <span>{subject}</span>
            </div>
          </div>
        </div>

        {/* Big Large Header */}
        <header className="mb-8 flex flex-col items-center text-center">
          {/* Current Subject Context Info */}
          <div className="space-y-0.5 flex flex-col items-center text-center">
             <p className="text-slate-400 font-bold text-xs sm:text-sm">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
             </p>
             <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {subjectEntry.topic}
             </h2>
             <div className="flex items-center justify-center gap-2 text-slate-500 font-bold text-[10px] sm:text-xs pt-1">
                <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {subjectEntry.time}
                </div>
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <span>{subjectEntry.teacher}</span>
             </div>
          </div>
        </header>

        {/* Tab switcher bar */}
        <div className="mb-8 flex justify-center">
          <div className="flex bg-white shadow-md border border-slate-100 rounded-full p-1.5 w-fit">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 sm:px-8 py-2.5 text-sm font-black rounded-full transition-all duration-300
                  ${activeTab === id
                    ? 'shadow-sm text-white'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                style={activeTab === id ? { backgroundColor: color } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
            <div className={`px-4 py-5 ${activeTab === 'journal' ? 'max-w-2xl mx-auto' : activeTab === 'activity' ? 'max-w-4xl mx-auto' : ''}`}>
              {activeTab === 'journey' && renderJourney()}
              {activeTab === 'activity' && renderActivity()}
              {activeTab === 'journal' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <NotebookPen size={15} style={{ color }} />
                    <h2 className="text-sm font-bold text-slate-700">Journal — {subject}</h2>
                  </div>
                  {renderJournal()}
                </div>
              )}

              {/* Subject navigation arrows (for non-journey tabs) */}
              {activeTab !== 'journey' && renderNavigation()}
            </div>
        </div>
      </div>

      {/* Afterclass Practice Modal */}
      {isPracticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-sm w-full mx-auto text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Afterclass Practice</h3>
            <p className="text-slate-600 mb-8 p-4 bg-indigo-50 rounded-2xl text-lg font-medium border border-indigo-100">
              This will available afterclass
            </p>
            <Button
              onClick={() => setIsPracticeModalOpen(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 text-base font-bold transition-transform active:scale-95"
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
