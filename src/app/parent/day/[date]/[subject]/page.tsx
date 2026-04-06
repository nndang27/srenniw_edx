'use client'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  BookOpen, Zap, Dumbbell, NotebookPen, MessageSquare, RefreshCw,
  Calendar, ExternalLink, Target, Eye, GraduationCap, Clock,
  Car, UtensilsCrossed, Bath, ShoppingCart, Blocks, CookingPot,
  ChefHat, MapPin, Palette,
} from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

/* ─── Types ──────────────────────────────────────────────────────────── */

type TabId = 'journey' | 'activity' | 'journal'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'journey',  label: 'Journey',  icon: Zap },
  { id: 'activity', label: 'Activity', icon: Dumbbell },
  { id: 'journal',  label: 'Journal',  icon: NotebookPen },
]

/* ─── Journal constants ──────────────────────────────────────────────── */

const COGNITIVE_LEVELS = [
  { id: 1, label: 'Aware',       desc: 'Knows about the topic' },
  { id: 2, label: 'Understands', desc: 'Can explain it' },
  { id: 3, label: 'Applies',     desc: 'Can use it to solve problems' },
  { id: 4, label: 'Analyses',    desc: 'Can compare and organise' },
  { id: 5, label: 'Creates',     desc: 'Can design new things with it' },
]

const EMOTIONS = [
  { id: 1, emoji: '🤔', label: 'Curious' },
  { id: 2, emoji: '😊', label: 'Excited' },
  { id: 3, emoji: '😴', label: 'Disengaged' },
  { id: 4, emoji: '😰', label: 'Anxious' },
  { id: 5, emoji: '😄', label: 'Happy' },
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
}

const CARD_ICONS = {
  chef: ChefHat,
  map: MapPin,
  palette: Palette,
} as const

const ACTIVITY_CARDS: Record<string, ActivityCard[]> = {
  Maths: [
    {
      emoji: '🎲',
      title: 'Fraction War Card Game',
      description: 'Use a deck of cards to create fractions. Highest fraction wins the round.',
      duration: '15 min',
      difficulty: 'Easy',
      color: 'from-orange-400 to-amber-500',
      calendarKey: 'Fraction+War+Card+Game',
      lessonLink: 'Fractions',
      learningGoals: ['Compare fractions with unlike denominators', 'Build mental maths speed'],
      parentTip: 'If they can explain why 3/4 beats 2/3, they\'ve got it!',
      icon: 'chef',
    },
    {
      emoji: '🛒',
      title: 'Supermarket Maths',
      description: 'Let them calculate totals and change during the next grocery run.',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-cyan-400 to-blue-500',
      calendarKey: 'Supermarket+Maths+Activity',
      lessonLink: 'Decimals & Money',
      learningGoals: ['Add prices mentally', 'Estimate totals and calculate change'],
      parentTip: 'Ask "Is this closer to $3 or $4?" — estimating builds number sense.',
      icon: 'map',
    },
    {
      emoji: '📏',
      title: 'Measure the House',
      description: 'Estimate then measure furniture — compare metric and informal units.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-purple-400 to-violet-500',
      calendarKey: 'Measure+the+House',
      lessonLink: 'Measurement',
      learningGoals: ['Use rulers and tape measures accurately', 'Convert between units'],
      parentTip: 'Ask them to predict before measuring — estimation is a key maths skill.',
      icon: 'palette',
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
    },
    {
      emoji: '🔦',
      title: 'Shadow Tracing',
      description: 'Trace shadows hourly to understand how the sun moves across the sky.',
      duration: '1 hr across day',
      difficulty: 'Medium',
      color: 'from-yellow-400 to-orange-500',
      calendarKey: 'Shadow+Tracing+Science',
      lessonLink: 'Earth & Space',
      learningGoals: ['Connect shadow changes to Earth\'s rotation', 'Record observations systematically'],
      parentTip: 'If they can predict where the shadow will be next, they understand it deeply!',
      icon: 'palette',
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
    },
    {
      emoji: '🎙️',
      title: 'Persuasion Challenge',
      description: 'Give them 2 minutes to convince you of something — then discuss what worked.',
      duration: '10 min',
      difficulty: 'Easy',
      color: 'from-violet-400 to-purple-500',
      calendarKey: 'Persuasion+Challenge',
      lessonLink: 'Persuasive Writing',
      learningGoals: ['Use evidence and reasoning to persuade', 'Vary sentence types for effect'],
      parentTip: 'Ask: "What was your strongest argument?" — metacognition builds writing skills.',
      icon: 'chef',
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
    },
    {
      emoji: '🌍',
      title: 'Country Research Box',
      description: 'Pick a country and find 5 interesting facts together using maps and books.',
      duration: '30 min',
      difficulty: 'Medium',
      color: 'from-green-400 to-teal-500',
      calendarKey: 'Country+Research+Box',
      lessonLink: 'World Geography',
      learningGoals: ['Research using multiple sources', 'Compare places and cultures'],
      parentTip: 'Ask them to find one similarity between that country and Australia.',
      icon: 'palette',
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
    },
    {
      emoji: '🎭',
      title: 'Mini Play',
      description: 'Act out a favourite story scene together — swap roles and try different emotions.',
      duration: '20 min',
      difficulty: 'Easy',
      color: 'from-rose-400 to-pink-500',
      calendarKey: 'Mini+Play+Drama',
      lessonLink: 'Drama & Performance',
      learningGoals: ['Use voice and body to convey emotion', 'Understand character perspective'],
      parentTip: 'Ask: "How would the villain say that line?" — perspective-taking is key in drama.',
      icon: 'map',
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
    },
    {
      emoji: '🚴',
      title: 'Bike Ride Challenge',
      description: 'Set a distance goal and track it on a map app — plan the route together.',
      duration: '45 min',
      difficulty: 'Medium',
      color: 'from-sky-400 to-blue-500',
      calendarKey: 'Bike+Ride+Challenge',
      lessonLink: 'Endurance & Fitness',
      learningGoals: ['Build cardiovascular endurance', 'Practise goal-setting and effort pacing'],
      parentTip: 'Ask: "How did you know when to push harder and when to rest?" — pacing awareness.',
      icon: 'palette',
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
  const [diveOpen, setDiveOpen] = useState(false)
  const [promptIndex, setPromptIndex] = useState(0)

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

  const renderJourney = () => (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Left: content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Essence card */}
        <Card className="border-none shadow-sm" style={{ background: bgColor }}>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-medium text-slate-800 leading-relaxed">{quickPeek.essence_text}</p>
            <div className="border-t border-slate-200/60 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Real-life example</p>
              <p className="text-sm text-slate-700 leading-relaxed">{quickPeek.relatable_example}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dive Deeper accordion */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={() => setDiveOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Dive Deeper</span>
            {diveOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
          {diveOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Core Concept</p>
                <p className="text-sm text-slate-700 leading-relaxed">{quickPeek.core_concept}</p>
              </div>
              {Object.keys(quickPeek.key_vocabulary).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Vocabulary</p>
                  <div className="space-y-2">
                    {Object.entries(quickPeek.key_vocabulary).map(([term, def]) => (
                      <div key={term} className="rounded-xl p-3" style={{ background: bgColor }}>
                        <p className="text-xs font-bold" style={{ color }}>{term}</p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{def}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Why This Matters</p>
                <p className="text-sm text-slate-700 leading-relaxed">{quickPeek.why_this_matters}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: TikTok panel — always shown */}
      <div className="lg:w-[340px] shrink-0">
        <TikTokHookPanel videos={quickPeek.videos} />
      </div>
    </div>
  )

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
              className={`w-2 h-2 rounded-full transition-all ${
                i === promptIndex ? 'bg-blue-500 w-5' : 'bg-blue-200 hover:bg-blue-300'
              }`}
              aria-label={`Go to prompt ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Activity Cards */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">🗓 This Weekend&apos;s Ideas</h2>
          <p className="text-slate-500">AI-matched activities based on what&apos;s being learned</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activityCards.map((activity, i) => {
            const IconComp = CARD_ICONS[activity.icon]
            return (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                <div className={`h-40 bg-gradient-to-br ${activity.color} flex items-center justify-center relative overflow-hidden`}>
                  <IconComp className="w-16 h-16 text-white/30 absolute -right-4 -top-4 transform rotate-12" />
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                    <IconComp className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-slate-700 border-none text-xs shadow-sm backdrop-blur-sm">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {activity.lessonLink}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">
                    {activity.emoji} {activity.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">{activity.description}</p>
                  <div className="mb-4 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      What your child will practise
                    </p>
                    {activity.learningGoals.map((goal, gi) => (
                      <p key={gi} className="text-sm text-slate-600 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {goal}
                      </p>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                    <p className="text-xs text-amber-800 flex items-start gap-1.5">
                      <Eye className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span><strong>What to look for:</strong> {activity.parentTip}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-normal">
                      {activity.difficulty}
                    </Badge>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {activity.duration}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-between group-hover:bg-slate-50 border-slate-200"
                    onClick={() => openCalendar(activity.calendarKey)}
                  >
                    Add to Calendar
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )

  const renderJournal = () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">How did this lesson go?</p>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-5 space-y-7">
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
            <div className="flex justify-between sm:justify-center sm:gap-4">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion.id}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  className={`flex flex-col items-center p-2 rounded-2xl transition-all duration-200 w-[52px]
                    ${selectedEmotion === emotion.id ? 'bg-orange-50 ring-2 ring-orange-400 scale-105 shadow-sm' : 'hover:bg-slate-50'}`}
                >
                  <span className="text-2xl mb-1">{emotion.emoji}</span>
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
        </CardContent>
      </Card>
    </div>
  )

  /* ─── Layout ── */

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-89px)]">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Sticky top bar: back + subject badge */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/parent')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Calendar</span>
        </button>
        <div className="flex-1" />
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
          style={{ background: bgColor, color }}
        >
          <span>{emoji}</span>
          <span>{subject}</span>
        </div>
      </div>

      {/* Subject + topic header */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
          {new Date(date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-xl font-bold text-slate-900">{subjectEntry.topic}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{subjectEntry.time} · {subjectEntry.teacher}</p>
      </div>

      {/* Body: sidebar (desktop) + content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar tabs */}
        <aside className="hidden md:flex flex-col w-44 shrink-0 bg-white border-r border-slate-100 pt-3 gap-1 p-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium text-left transition-all
                ${activeTab === id
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              style={activeTab === id ? { background: bgColor, color } : undefined}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </aside>

        {/* Mobile horizontal tab bar */}
        <div className="md:hidden flex border-b border-slate-100 bg-white absolute left-0 right-0 z-10" style={{ top: '89px' }} />

        <div className="flex flex-1 flex-col overflow-auto">
          {/* Mobile tab bar */}
          <div className="md:hidden flex border-b border-slate-100 bg-white sticky top-0 z-10">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all border-b-2
                  ${activeTab === id
                    ? 'border-current'
                    : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                style={activeTab === id ? { color, borderColor: color } : undefined}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            <div className={`px-4 py-5 ${activeTab !== 'journey' ? 'max-w-2xl mx-auto' : ''}`}>
              {activeTab === 'journey' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={15} style={{ color }} />
                    <h2 className="text-sm font-bold text-slate-700">Quick Peek</h2>
                  </div>
                  {renderJourney()}
                </div>
              )}
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

              {/* Subject navigation arrows */}
              <div className="flex items-center justify-between pt-6 pb-8 mt-6 border-t border-slate-100">
                {prevSubject ? (
                  <button
                    onClick={() => router.push(`/parent/day/${date}/${encodeURIComponent(prevSubject.subject)}`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <ChevronLeft size={16} />
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 leading-none mb-0.5">Previous</p>
                      <p>{prevSubject.subject}</p>
                    </div>
                  </button>
                ) : <div />}

                {nextSubject ? (
                  <button
                    onClick={() => router.push(`/parent/day/${date}/${encodeURIComponent(nextSubject.subject)}`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 leading-none mb-0.5">Next</p>
                      <p>{nextSubject.subject}</p>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                ) : <div />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
