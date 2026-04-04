'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, RefreshCw, Calendar, ExternalLink, ChefHat, MapPin, Leaf } from 'lucide-react'
import { useApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Activity, Notification } from '@/types'

const FALLBACK_PROMPTS = [
  "At the supermarket today, ask your child: 'Can you find two items that together cost less than $5? Let's add them up!'",
  "While making dinner: 'If we cut this pizza into 8 slices instead of 4, how many slices equals one half?'",
  "On the drive home: 'I see 10 cars. If half are white, how many white cars are there?'",
  "During playtime: 'Can you build a tower where exactly 1/4 of the blocks are red?'",
]

const FALLBACK_ACTIVITIES = [
  {
    title: '🍕 Pizza Fraction Night',
    description: 'While cooking dinner, practice fractions naturally. Cut pizza into different amounts and explore equivalent fractions.',
    duration: '15-20 min',
    difficulty: 'Easy',
    color: 'from-orange-400 to-amber-500',
    calendarKey: 'Pizza+Fraction+Night',
  },
  {
    title: '🛒 Supermarket Math',
    description: 'On the next shopping trip, use the price tags to practice fractions and percentages. Great real-world application!',
    duration: '30 min',
    difficulty: 'Medium',
    color: 'from-cyan-400 to-blue-500',
    calendarKey: 'Supermarket+Math+Activity',
  },
  {
    title: '🎨 Fraction Art',
    description: 'Draw a picture and colour exactly 1/4, 1/2 and 3/4 of different shapes. Creative and mathematical!',
    duration: '20 min',
    difficulty: 'Easy',
    color: 'from-purple-400 to-violet-500',
    calendarKey: 'Fraction+Art+Activity',
  },
]

function openCalendar(title: string) {
  const url = `https://calendar.google.com/calendar/r/eventedit?text=${title}&details=Learning+activity+from+Srenniw`
  window.open(url, '_blank')
}

export default function ActionPage() {
  const api = useApi()
  const [prompts, setPrompts] = useState<string[]>(FALLBACK_PROMPTS)
  const [promptIndex, setPromptIndex] = useState(0)
  const [activities, setActivities] = useState<{ title: string; description: string; duration: string; difficulty: string; color: string; calendarKey: string }[]>(FALLBACK_ACTIVITIES)

  useEffect(() => {
    api.getInbox()
      .then(({ items }) => {
        const brief = items[0]?.brief
        if (!brief) return
        const acts = brief.at_home_activities || []
        if (acts.length > 0) {
          setPrompts(acts.map(a => `Try this: ${a.title} — ${a.description}`))
          setActivities(acts.map((a, i) => ({
            title: a.title,
            description: a.description,
            duration: `${a.duration_mins} min`,
            difficulty: i === 0 ? 'Easy' : i === 1 ? 'Medium' : 'Easy',
            color: ['from-orange-400 to-amber-500', 'from-cyan-400 to-blue-500', 'from-emerald-400 to-green-500'][i % 3],
            calendarKey: encodeURIComponent(a.title),
          })))
        }
      })
      .catch(console.error)
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-4 sm:p-6 pb-24">

      {/* Conversation Starter */}
      <section>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="bg-white p-4 rounded-full shadow-sm text-amber-500 shrink-0">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">💬 Try this today</h3>
              <p className="text-xl sm:text-2xl font-medium text-slate-800 leading-tight">
                {prompts[promptIndex]}
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
        </div>
      </section>

      {/* Activity Cards */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">🗓 This Weekend&apos;s Ideas</h2>
          <p className="text-slate-500">AI-matched activities based on what&apos;s being learned</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
              <div className={`h-40 bg-gradient-to-br ${activity.color} flex items-center justify-center relative overflow-hidden`}>
                <ChefHat className="w-16 h-16 text-white/30 absolute -right-4 -top-4 transform rotate-12" />
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                  {i === 0 ? <ChefHat className="w-8 h-8 text-white" />
                    : i === 1 ? <MapPin className="w-8 h-8 text-white" />
                    : <Leaf className="w-8 h-8 text-white" />}
                </div>
              </div>
              <CardContent className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{activity.title}</h3>
                <p className="text-slate-600 text-sm mb-6 flex-1">{activity.description}</p>
                <div className="flex items-center gap-2 mb-6">
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
          ))}
        </div>
      </section>
    </div>
  )
}
