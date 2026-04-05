'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import TikTokHookPanel from '@/components/quick-peek/TikTokHookPanel'

const mockDigestData: Record<string, any[]> = {
  "Monday": [
    {
      subject: "Biology",
      summarize_simplification: {
        essence_text: "Today, the class learned how plants make their own food using sunlight! Unlike humans who have to eat meals, plants act like tiny solar panels, catching light from the sun and mixing it with water and air to cook up their own sugary snacks.",
        relatable_example: "Imagine baking a cake. You need ingredients like flour, eggs, and sugar, plus the heat from the oven. For a plant, the 'ingredients' are water and air, and the 'oven' is the warmth and energy from the sun!"
      },
      more_knowledge_accordion: {
        core_concept: "The scientific process where green plants use sunlight to turn water and carbon dioxide into food and oxygen.",
        key_vocabulary: {
          "Chlorophyll": "The special green color in leaves that acts like a net to catch the sunlight.",
          "Carbon Dioxide": "The invisible gas that we breathe out, which plants absorb to help make their food.",
          "Oxygen": "The fresh air that plants release into the atmosphere, which humans and animals need to breathe."
        },
        why_this_matters: "Without this process, there would be no food for us or animals to eat, and no fresh air for us to breathe. Plants literally keep the whole planet alive!"
      },
      tiktok_search_keywords: [
        "photosynthesis animation for kids",
        "how plants make food visual"
      ],
      videos: [
        "/samples/sample1.mp4",
        "/samples/sample2.mp4", 
        "/samples/sample3.mp4",
        "/samples/sample4.mp4",
        "/samples/sample5.mp4"
      ]
    },
    {
      subject: "Math",
      summarize_simplification: {
        essence_text: "We started learning about geometry today! Students discovered that shapes are everywhere around us, from the rectangular doors to the circular clocks.",
        relatable_example: "When you slice a sandwich diagonally, you turn one big rectangle into two triangles. Next time you make lunch, ask them what shapes they can find!"
      },
      more_knowledge_accordion: {
        core_concept: "Geometry is the branch of mathematics concerned with shapes, sizes, relative position of figures, and the properties of space.",
        key_vocabulary: {
          "Polygon": "A flat shape with straight sides, like a triangle, square, or pentagon.",
          "Vertex": "The corner dot where two straight lines meet in a shape.",
          "Symmetry": "When one half of a shape is the exact mirror image of the other half."
        },
        why_this_matters: "Geometry helps us understand how to build things correctly, from building a strong bridge to packing a suitcase efficiently!"
      },
      tiktok_search_keywords: ["geometry for kids", "shapes in real life"],
      videos: ["/samples/sample2.mp4"]
    },
    {
      subject: "Physics",
      summarize_simplification: {
        essence_text: "Gravity was the big topic today! We explored how the Earth pulls everything toward its center, which is why things fall down instead of floating away.",
        relatable_example: "Think of jumping on a trampoline. The trampoline pushes you up, but gravity is the invisible elastic band that always pulls you right back down to the ground."
      },
      more_knowledge_accordion: {
        core_concept: "Gravity is a fundamental force of nature that attracts two bodies toward each other.",
        key_vocabulary: {
          "Force": "A push or a pull on an object.",
          "Mass": "The amount of matter in an object. Often related to weight.",
          "Acceleration": "How quickly the speed of an object is changing."
        },
        why_this_matters: "Without gravity, we wouldn't stay on the ground, the moon wouldn't orbit the Earth, and the Earth wouldn't orbit the sun!"
      },
      tiktok_search_keywords: ["gravity experiment kids", "why things fall down"],
      videos: ["/samples/sample3.mp4"]
    }
  ],
  "Tuesday": [
    {
      subject: "Math",
      summarize_simplification: {
        essence_text: "Today in math, we tackled fractions by looking at them as pieces of a whole. Instead of confusing numbers on a page, we focused on how fractions are exactly like slicing up your favorite pizza or sharing a chocolate bar.",
        relatable_example: "If you order a pizza and it's sliced into 8 equal pieces, each slice is 1/8 of the pizza. If you eat 3 slices, you've eaten 3/8! Next time you have dinner, try asking them what fraction of the meal is vegetables."
      },
      more_knowledge_accordion: {
        core_concept: "A mathematical way of expressing a part of a whole, consisting of a numerator (top number) and denominator (bottom number).",
        key_vocabulary: {
          "Numerator": "The top number in a fraction that tells you how many parts you actually have.",
          "Denominator": "The bottom number showing how many equal parts the whole is divided into.",
          "Equivalent Fractions": "Different fractions that represent the same amount, like 1/2 and 2/4."
        },
        why_this_matters: "Fractions are everywhere in the real world! From halving a recipe while baking, to reading time (a quarter past three), to managing money."
      },
      tiktok_search_keywords: [
        "teaching fractions with pizza",
        "fractions for kids explained"
      ],
      videos: ["https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"]
    },
    {
      subject: "Art",
      summarize_simplification: {
        essence_text: "A splash of color awaits! Students will be introduced to primary colors and mixing them to create brand new shades.",
        relatable_example: "When you mix red and yellow paints, you get orange! Mixing colors is like a magic spell where two colors create an entirely new one."
      },
      more_knowledge_accordion: {
        core_concept: "Color theory involves understanding the color wheel, primary, secondary, and tertiary colors.",
        key_vocabulary: {
          "Primary Colors": "Red, blue, and yellow. These are the building blocks of all other colors.",
          "Secondary Colors": "Colors created by mixing two primary colors together (orange, green, purple)."
        },
        why_this_matters: "Understanding colors helps artists express feelings and make things look beautiful or realistic. It is also used everywhere in graphic design and branding!"
      },
      tiktok_search_keywords: ["color wheel for kids", "mixing paint primary colors"],
      videos: ["https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"]
    }
  ],
  "Wednesday": [
    {
      subject: "History",
      summarize_simplification: {
        essence_text: "We traveled back in time today to explore Ancient Egypt, discovering how people lived thousands of years ago alongside the great Nile River. We learned that the pyramids weren't just big triangles, but giant, carefully constructed tombs for their pharaohs.",
        relatable_example: "Think of a pharaoh as a combination of a king and a superstar. Building a pyramid was like constructing the biggest, most complex puzzle ever made, taking tens of thousands of workers perfectly placing giant blocks."
      },
      more_knowledge_accordion: {
        core_concept: "The civilization of Ancient Egypt flourished along the Nile River, known for its monumental architecture, complex religion, and writing system.",
        key_vocabulary: {
          "Pharaoh": "The supreme ruler of Ancient Egypt, considered both a king and a god.",
          "Hieroglyphics": "The ancient Egyptian writing system that used pictures and symbols instead of letters.",
          "Mummification": "The special process of drying and wrapping a body to preserve it for the afterlife."
        },
        why_this_matters: "Ancient Egypt gave us incredible advancements in engineering, architecture, and written language. Their ability to solve complex problems laid the foundation for modern mathematics and engineering!"
      },
      tiktok_search_keywords: [
        "ancient egypt facts for kids",
        "how pyramids were built simple"
      ],
      videos: ["https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"]
    }
  ],
  "Thursday": [],
  "Friday": []
};

export default function SmartDigestPage() {
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [activeSubjectIndex, setActiveSubjectIndex] = useState<number>(0);
  
  // Reset subject index when switching days
  useEffect(() => {
    setActiveSubjectIndex(0);
  }, [activeDay]);

  const currentDayData = mockDigestData[activeDay as keyof typeof mockDigestData];
  const currentData = currentDayData?.length > 0 ? currentDayData[activeSubjectIndex] : null;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 p-4 sm:p-8 lg:p-12 font-sans overflow-x-hidden text-slate-800">
      
      {/* Main Content Area (Column 2) */}
      <div className="flex-1 flex flex-col">
        <header className="mb-8 mt-2">
          <p className="text-indigo-500 font-bold tracking-widest uppercase text-sm mb-3">Learning Journey</p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">Next Week&apos;s Adventure</h1>
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
