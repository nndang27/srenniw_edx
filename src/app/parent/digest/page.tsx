'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import TikTokHookPanel from '@/components/quick-peek/TikTokHookPanel'
import { useApi } from '@/lib/api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

export default function SmartDigestPage() {
  const api = useApi()
  const [digestData, setDigestData] = useState<Record<string, any[]>>({})
  const [digestLoading, setDigestLoading] = useState(true)
  const [activeDay, setActiveDay] = useState<string>('Monday')
  const [activeSubjectIndex, setActiveSubjectIndex] = useState<number>(0)

  useEffect(() => {
    api.getParentWeeklyDigest()
      .then(data => setDigestData(data))
      .catch(console.error)
      .finally(() => setDigestLoading(false))
  }, [])

  // Reset subject index when switching days
  useEffect(() => {
    setActiveSubjectIndex(0)
  }, [activeDay])

  const currentDayData = digestData[activeDay] ?? []
  const currentData = currentDayData.length > 0 ? currentDayData[activeSubjectIndex] : null

  if (digestLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 animate-pulse text-lg font-semibold">Loading this week&apos;s content…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 p-4 sm:p-8 lg:p-12 font-sans overflow-x-hidden text-slate-800">

      {/* Main Content Area (Column 2) */}
      <div className="flex-1 flex flex-col">
        <header className="mb-8 mt-2">
          <p className="text-indigo-500 font-bold tracking-widest uppercase text-sm mb-3">Learning Journey</p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">This Week&apos;s Learning</h1>
        </header>

        {/* Horizontal 5-Day Calendar (Line of Circles) */}
        <div className="flex items-center justify-between w-full mb-10 lg:mb-12 relative px-2 sm:px-4 shrink-0">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, idx, arr) => {
            const isActive = activeDay === day;
            const isLast = idx === arr.length - 1;
            const isPast = arr.indexOf(activeDay) >= idx;

            return (
              <div key={day} className={`flex items-center ${!isLast ? 'flex-1' : ''}`}>
                <div 
                  className="relative flex flex-col items-center group cursor-pointer"
                  onClick={() => setActiveDay(day)}
                >
                  <div 
                     className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 z-10 relative
                       ${isActive 
                         ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100 scale-110' 
                         : isPast 
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                            : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-indigo-300 hover:text-indigo-500'}`}
                  >
                     {day.slice(0, 3)}
                  </div>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className="flex-1 h-1 mx-2 sm:mx-4 rounded-full bg-slate-200 relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: isPast && arr.indexOf(activeDay) > idx ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* The Trailer */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 mb-6 lg:mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-50 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500 shrink-0">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          {currentData?.subject && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-wider rounded-full">
                {currentData.subject}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
             <div className="flex items-center gap-3">
               <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                 ✨ The 60-Second Summary
               </h3>
             </div>
          </div>
          {currentData?.summarize_simplification ? (
            <>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-medium mt-2">
                {currentData.summarize_simplification.essence_text}
              </p>
              <div className="mt-6 p-5 bg-indigo-50/70 rounded-2xl border border-indigo-100/50">
                <span className="font-bold text-indigo-900 block mb-1">Real-world example:</span>
                <p className="italic text-slate-700 leading-relaxed">
                  {currentData.summarize_simplification.relatable_example}
                </p>
              </div>
            </>
          ) : (
             <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-medium mt-2">
                Stay tuned! Content for this day is still being prepared.
             </p>
          )}
        </div>

        {/* The Deep Dive */}
        {currentData?.more_knowledge_accordion && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 shrink-0">
            <h3 className="text-lg sm:text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
              🚀 Dive Deeper
            </h3>
            <Accordion type="single" collapsible className="w-full space-y-4">
              
              <AccordionItem 
                value="core-concept"
                className="border border-slate-100 rounded-2xl px-5 data-[state=open]:bg-slate-50/50 data-[state=open]:border-slate-200 transition-all duration-300"
              >
                <AccordionTrigger className="text-lg font-bold text-slate-800 hover:text-indigo-600 hover:no-underline py-4 text-left">
                  Core Concept
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-5">
                  {currentData.more_knowledge_accordion.core_concept}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="key-vocabulary"
                className="border border-slate-100 rounded-2xl px-5 data-[state=open]:bg-slate-50/50 data-[state=open]:border-slate-200 transition-all duration-300"
              >
                <AccordionTrigger className="text-lg font-bold text-slate-800 hover:text-indigo-600 hover:no-underline py-4 text-left">
                  Key Vocabulary
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-5">
                  <ul className="space-y-3">
                    {Object.entries(currentData.more_knowledge_accordion.key_vocabulary).map(([term, def], idx) => (
                      <li key={idx} className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <span className="font-bold text-slate-800 shrink-0">{term}:</span>
                        <span className="text-slate-600">{def as string}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="why-this-matters"
                className="border border-slate-100 rounded-2xl px-5 data-[state=open]:bg-slate-50/50 data-[state=open]:border-slate-200 transition-all duration-300"
              >
                <AccordionTrigger className="text-lg font-bold text-slate-800 hover:text-indigo-600 hover:no-underline py-4 text-left">
                  Why This Matters
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-5">
                  {currentData.more_knowledge_accordion.why_this_matters}
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        )}

        {/* Navigation Arrows for Subjects */}
        {currentDayData && currentDayData.length > 1 && (
          <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 shrink-0">
            <button 
              onClick={() => setActiveSubjectIndex(Math.max(0, activeSubjectIndex - 1))}
              disabled={activeSubjectIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-600 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous Subject</span>
            </button>
            <div className="text-slate-500 font-medium text-sm">
              Subject {activeSubjectIndex + 1} of {currentDayData.length}
            </div>
            <button 
              onClick={() => setActiveSubjectIndex(Math.min(currentDayData.length - 1, activeSubjectIndex + 1))}
              disabled={activeSubjectIndex === currentDayData.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-600 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">Next Subject</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Column 3: The TikTok Scroll */}
      <div className="w-full lg:w-[400px] shrink-0 lg:pt-4">
        <TikTokHookPanel videos={currentData?.videos || []} />
      </div>
    </div>
  );
}
