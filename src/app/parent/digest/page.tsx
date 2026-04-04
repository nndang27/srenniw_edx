'use client'
import { useEffect, useState } from 'react'
import { BookOpen, BookOpenCheck, BrainCircuit, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { createBrowserClient } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import type { Notification, Activity } from '@/types'

const FLASHCARDS_DEFAULT = [
  { q: 'What does "equivalent fraction" mean?', a: 'Two fractions that represent the same value. Example: 1/2 = 2/4 = 4/8' },
  { q: 'What is the top number of a fraction called?', a: 'The numerator. It tells you how many parts you have.' },
  { q: 'What is the bottom number of a fraction called?', a: 'The denominator. It tells you how many parts make a whole.' },
  { q: 'If you cut a pizza into 8 slices and eat 4, what fraction did you eat?', a: '4/8, which is equivalent to 1/2.' },
  { q: 'True or False: 3/6 is equivalent to 1/2', a: 'True! Both represent half of a whole.' },
]

export default function DigestPage() {
  const api = useApi()
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const fetchInbox = () => {
    api.getInbox()
      .then(({ items }) => setNotifications(items))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchInbox() }, [])

  // Mark latest unread as read
  useEffect(() => {
    const first = notifications.find(n => !n.is_read)
    if (first) api.markRead(first.notification_id).catch(console.error)
  }, [notifications])

  // Supabase Realtime
  useEffect(() => {
    if (!user?.id) return
    const supabase = createBrowserClient()
    const channel = supabase.channel('digest-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const notif = payload.new as any
        if (notif.parent_clerk_id === user.id) fetchInbox()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const latestBrief = notifications[0]?.brief
  const activities: Activity[] = latestBrief?.at_home_activities || []
  const flashcards = activities.length > 0
    ? activities.map((a, i) => ({ q: `Activity ${i + 1}: ${a.title}`, a: a.description }))
    : FLASHCARDS_DEFAULT

  const handleNext = () => { setShowAnswer(false); setFlashcardIndex(p => (p + 1) % flashcards.length) }
  const handlePrev = () => { setShowAnswer(false); setFlashcardIndex(p => (p - 1 + flashcards.length) % flashcards.length) }

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-4 sm:p-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Hi {user?.firstName || 'there'}! 👋
          </h2>
          <p className="text-slate-500">
            {latestBrief
              ? `Here's what ${latestBrief.subject || 'your child'} is learning this week.`
              : 'No updates yet from school.'}
          </p>
        </div>
        <Select defaultValue="current">
          <SelectTrigger className="w-[200px] bg-white font-medium text-slate-700 shadow-sm border-slate-200">
            <SelectValue placeholder="Select week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!latestBrief ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No school updates yet. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="60sec" className="w-full">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <div className="p-2 bg-slate-50 border-b border-slate-100">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1">
                <TabsTrigger value="60sec" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2">
                  <BookOpen className="w-4 h-4 mr-2" />
                  60 Sec
                </TabsTrigger>
                <TabsTrigger value="deepdive" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2">
                  <BookOpenCheck className="w-4 h-4 mr-2 hidden sm:inline" />
                  Deep Dive
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2">
                  <BrainCircuit className="w-4 h-4 mr-2 hidden sm:inline" />
                  Flashcards
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-6 sm:p-8 min-h-[300px]">
              {/* 60 Second Read */}
              <TabsContent value="60sec" className="mt-0 outline-none">
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {latestBrief.subject && (
                      <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                        {latestBrief.subject}
                      </span>
                    )}
                    {latestBrief.year_level && (
                      <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                        {latestBrief.year_level}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed text-lg sm:text-xl">
                    {latestBrief.content || latestBrief.processed_en || 'Content is being processed...'}
                  </p>
                  {activities.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-sm font-semibold text-amber-800 mb-2">🏠 At-home Activities:</p>
                      <ul className="space-y-1">
                        {activities.slice(0, 3).map((a, i) => (
                          <li key={i} className="text-sm text-amber-700">• {a.title} ({a.duration_mins} min)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Deep Dive */}
              <TabsContent value="deepdive" className="mt-0 outline-none">
                <Accordion type="single" collapsible className="w-full" defaultValue="summary">
                  <AccordionItem value="summary" className="border-slate-100">
                    <AccordionTrigger className="text-lg font-semibold hover:text-primary hover:no-underline">
                      📝 What they're learning
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 text-base leading-relaxed">
                      {latestBrief.content || latestBrief.processed_en || 'No details yet.'}
                    </AccordionContent>
                  </AccordionItem>
                  {activities.length > 0 && (
                    <AccordionItem value="activities" className="border-slate-100">
                      <AccordionTrigger className="text-lg font-semibold hover:text-primary hover:no-underline">
                        🏠 How to help at home
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {activities.map((a, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-xl">
                              <p className="font-semibold text-slate-800">{a.title}</p>
                              <p className="text-sm text-slate-600 mt-1">{a.description}</p>
                              <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                {a.duration_mins} min
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  <AccordionItem value="curriculum" className="border-slate-100 border-b-0">
                    <AccordionTrigger className="text-lg font-semibold hover:text-primary hover:no-underline">
                      🌍 Available in
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 text-base">
                      <div className="flex gap-2">
                        {['EN', 'VI', 'ZH', 'AR'].map(lang => (
                          <span key={lang} className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">{lang}</span>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              {/* Flashcards */}
              <TabsContent value="flashcards" className="mt-0 outline-none">
                <div className="flex flex-col items-center">
                  <div
                    className="w-full max-w-md aspect-[4/3] rounded-2xl cursor-pointer relative"
                    onClick={() => setShowAnswer(!showAnswer)}
                    data-testid={`flashcard-${flashcardIndex}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm transition-opacity duration-300 ${showAnswer ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                      <span className="text-xs font-bold text-blue-600 tracking-widest uppercase absolute top-6">Question</span>
                      <h3 className="text-2xl font-bold text-slate-800 leading-tight">{flashcards[flashcardIndex].q}</h3>
                      <p className="text-sm text-slate-400 absolute bottom-6">Tap to reveal answer</p>
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm transition-opacity duration-300 ${showAnswer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <span className="text-xs font-bold text-emerald-600 tracking-widest uppercase absolute top-6">Answer</span>
                      <h3 className="text-xl font-medium text-slate-800 leading-relaxed">{flashcards[flashcardIndex].a}</h3>
                      <p className="text-sm text-slate-400 absolute bottom-6">Tap to flip back</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-8">
                    <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-slate-200" onClick={handlePrev}>
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <span className="font-medium text-slate-500 min-w-[80px] text-center">
                      {flashcardIndex + 1} of {flashcards.length}
                    </span>
                    <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-slate-200" onClick={handleNext}>
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}

      <div className="flex justify-center mt-8">
        <Link href="/parent/journal">
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl h-14 px-8 text-lg shadow-md w-full sm:w-auto">
            📓 Log Today&apos;s Journal
          </Button>
        </Link>
      </div>
    </div>
  )
}
