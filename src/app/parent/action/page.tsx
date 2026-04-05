'use client'
import { useEffect, useState } from 'react'
import {
  MessageSquare, RefreshCw, Calendar, ExternalLink,
  ChefHat, MapPin, Palette, BookOpen, Target, Eye,
  GraduationCap, Clock, Car, UtensilsCrossed, Bath,
  ShoppingCart, Blocks, CookingPot,
} from 'lucide-react'
import { useApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Activity, Notification } from '@/types'

/* ── Unified prompts: context + question + lesson review ── */
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

const FALLBACK_PROMPTS: ReadonlyArray<ReviewPrompt> = [
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
    prompt: "'If we cut this pizza into 8 slices instead of 4, how many slices equals one half?'",
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
    moment: 'Playtime',
    icon: 'play',
    topic: 'Fractions of a Set',
    prompt: "'Can you build a tower where exactly 1/4 of the blocks are red?'",
    reviewGoal: 'Applies fractions to real objects — hands-on review',
    timeNeeded: '10 min',
  },
  {
    moment: 'Cooking together',
    icon: 'kitchen',
    topic: 'Measurement & Fractions',
    prompt: "'We need 1 and 1/2 cups of flour. Can you measure it using only the 1/4 cup?'",
    reviewGoal: 'Reviews adding fractions and measurement units',
    timeNeeded: '3 min',
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
    moment: 'In the car',
    icon: 'car',
    topic: 'Skip Counting',
    prompt: "'Can you count backwards from 20 by 2s? Let's race!'",
    reviewGoal: 'Reinforces skip counting and number patterns',
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
  {
    moment: 'At dinner',
    icon: 'dinner',
    topic: 'Patterns',
    prompt: "'If today is Tuesday and your project is due in 10 days, what day will that be?'",
    reviewGoal: 'Practises counting on and days of the week patterns',
    timeNeeded: '2 min',
  },
]

/* ── Activity cards with lesson connection + parent guidance ── */
const FALLBACK_ACTIVITIES = [
  {
    emoji: '🍕',
    title: 'Pizza Fraction Night',
    description: 'While cooking dinner, practice fractions naturally. Cut pizza into different amounts and explore equivalent fractions.',
    duration: '15–20 min',
    difficulty: 'Easy',
    color: 'from-orange-400 to-amber-500',
    calendarKey: 'Pizza+Fraction+Night',
    lessonLink: 'Equivalent Fractions',
    learningGoals: ['Identify 1/2, 1/4, 1/8 of a whole', 'Compare fractions with different denominators'],
    parentTip: 'If your child can explain why 2/8 = 1/4 using the pizza, they\'ve nailed it!',
    icon: 'chef' as const,
  },
  {
    emoji: '🛒',
    title: 'Supermarket Math',
    description: 'On the next shopping trip, use the price tags to practice fractions and percentages. Great real-world application!',
    duration: '30 min',
    difficulty: 'Medium',
    color: 'from-cyan-400 to-blue-500',
    calendarKey: 'Supermarket+Math+Activity',
    lessonLink: 'Decimals & Money',
    learningGoals: ['Add prices mentally', 'Estimate totals before checkout'],
    parentTip: 'Ask "Is this closer to $3 or $4?" — estimating builds number sense.',
    icon: 'map' as const,
  },
  {
    emoji: '🎨',
    title: 'Fraction Art',
    description: 'Draw a picture and colour exactly 1/4, 1/2 and 3/4 of different shapes. Creative and mathematical!',
    duration: '20 min',
    difficulty: 'Easy',
    color: 'from-purple-400 to-violet-500',
    calendarKey: 'Fraction+Art+Activity',
    lessonLink: 'Parts of a Whole',
    learningGoals: ['Shade fractions of shapes accurately', 'Recognise fractions visually'],
    parentTip: 'If they can shade 3/4 without help, they understand the concept well.',
    icon: 'palette' as const,
  },
]

const CARD_ICONS = {
  chef: ChefHat,
  map: MapPin,
  palette: Palette,
} as const

function openCalendar(title: string) {
  const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&details=Learning+activity+from+Srenniw`
  window.open(url, '_blank')
}

export default function ActionPage() {
  const api = useApi()
  const [prompts, setPrompts] = useState<ReadonlyArray<ReviewPrompt>>(FALLBACK_PROMPTS)
  const [promptIndex, setPromptIndex] = useState(0)
  const [activities, setActivities] = useState(FALLBACK_ACTIVITIES)

  useEffect(() => {
    api.getInbox()
      .then(({ items }) => {
        const brief = items[0]?.brief
        if (!brief) return
        const acts = brief.at_home_activities || []
        if (acts.length > 0) {
          const momentOptions: Array<{ moment: string; icon: ReviewPrompt['icon'] }> = [
            { moment: 'At the shops', icon: 'shopping' },
            { moment: 'In the car', icon: 'car' },
            { moment: 'At dinner', icon: 'dinner' },
            { moment: 'Cooking together', icon: 'kitchen' },
            { moment: 'Bath time', icon: 'bath' },
            { moment: 'Playtime', icon: 'play' },
          ]
          setPrompts(acts.map((a, i) => {
            const m = momentOptions[i % momentOptions.length]
            return {
              moment: m.moment,
              icon: m.icon,
              topic: 'From your teacher',
              prompt: `${a.title} — ${a.description}`,
              reviewGoal: 'Linked to this week\'s classroom lesson',
              timeNeeded: `${a.duration_mins} min`,
            }
          }))
          setActivities(acts.map((a, i) => ({
            emoji: ['🍕', '🛒', '🎨'][i % 3],
            title: a.title,
            description: a.description,
            duration: `${a.duration_mins} min`,
            difficulty: (i === 1 ? 'Medium' : 'Easy') as 'Easy' | 'Medium',
            color: ['from-orange-400 to-amber-500', 'from-cyan-400 to-blue-500', 'from-emerald-400 to-green-500'][i % 3],
            calendarKey: encodeURIComponent(a.title),
            lessonLink: 'This week\'s lesson',
            learningGoals: ['Practice through play', 'Review classroom concepts at home'],
            parentTip: 'Ask your child to explain each step — teaching is the best way to learn!',
            icon: (['chef', 'map', 'palette'] as const)[i % 3],
          })))
        }
      })
      .catch(console.error)
  }, [])

  const current = prompts[promptIndex]
  const MomentIcon = MOMENT_ICONS[current.icon]

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-4 sm:p-6 pb-24">

      {/* ── Unified Review Prompt Carousel ── */}
      <section>
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40 pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-violet-200 rounded-full blur-3xl opacity-30 pointer-events-none" />

          {/* Top bar: context chips */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">💬 Try this today</h3>
              <span className="text-slate-300">|</span>
              <Badge variant="secondary" className="bg-white/80 text-slate-600 border-none text-xs font-medium shadow-sm">
                <MomentIcon className="w-3 h-3 mr-1" />
                {current.moment}
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none text-xs font-medium">
                <GraduationCap className="w-3 h-3 mr-1" />
                {current.topic}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-xs font-medium">
                <Clock className="w-3 h-3 mr-1" />
                {current.timeNeeded}
              </Badge>
            </div>
            <span className="text-xs text-slate-400 font-medium tabular-nums hidden sm:block">
              {promptIndex + 1} / {prompts.length}
            </span>
          </div>

          {/* Main prompt content */}
          <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-start sm:items-center px-6 py-5">
            <div className="bg-white p-3.5 rounded-full shadow-sm text-amber-500 shrink-0">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="flex-1 space-y-2.5 min-w-0">
              <p className="text-xl sm:text-2xl font-medium text-slate-800 leading-tight">
                {current.prompt}
              </p>
              <p className="text-sm text-blue-600 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span><span className="font-medium">Review goal:</span> {current.reviewGoal}</span>
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 bg-white hover:bg-slate-50 border-blue-200 text-blue-700 self-end sm:self-center"
              onClick={() => setPromptIndex(p => (p + 1) % prompts.length)}
              data-testid="button-shuffle-prompt"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Shuffle
            </Button>
          </div>

          {/* Bottom dot indicators */}
          <div className="relative z-10 flex justify-center gap-1.5 pb-4">
            {prompts.map((_, i) => (
              <button
                key={i}
                onClick={() => setPromptIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === promptIndex
                    ? 'bg-blue-500 w-5'
                    : 'bg-blue-200 hover:bg-blue-300'
                }`}
                aria-label={`Go to prompt ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Weekend Activity Cards (with Learning Goals + Parent Tips) ── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">🗓 This Weekend&apos;s Ideas</h2>
          <p className="text-slate-500">AI-matched activities based on what&apos;s being learned</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, i) => {
            const IconComp = CARD_ICONS[activity.icon]
            return (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                {/* Card header gradient */}
                <div className={`h-40 bg-gradient-to-br ${activity.color} flex items-center justify-center relative overflow-hidden`}>
                  <IconComp className="w-16 h-16 text-white/30 absolute -right-4 -top-4 transform rotate-12" />
                  <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                    <IconComp className="w-8 h-8 text-white" />
                  </div>
                  {/* Lesson link badge on card */}
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

                  {/* Learning Goals */}
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

                  {/* Parent Tip */}
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                    <p className="text-xs text-amber-800 flex items-start gap-1.5">
                      <Eye className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span><strong>What to look for:</strong> {activity.parentTip}</span>
                    </p>
                  </div>

                  {/* Meta + CTA */}
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
}
