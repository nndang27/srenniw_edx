'use client'
import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  ChevronDown, ChevronLeft, ChevronRight, Pencil, Calendar, List,
  CheckCircle, X, Save, Sparkles, Wifi, RefreshCw, BookOpen,
  ClipboardList, Users, Zap, Send, MessageSquare, Plus, Paperclip, Trash2, Target,
} from 'lucide-react'
import { SUBJECTS } from '@/lib/mockTeacherData'
import type { ClassroomCourseData, ClassroomItem, ClassroomWeeklyTopic } from '@/lib/api'
import { cacheGet, cacheSet, cacheDelete } from '@/lib/sessionCache'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

const SUBJECT_COLORS: Record<string, string> = {
  Maths: 'bg-blue-100 text-blue-700 border-blue-200',
  Science: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  English: 'bg-violet-100 text-violet-700 border-violet-200',
  HSIE: 'bg-amber-100 text-amber-700 border-amber-200',
  'Creative Arts': 'bg-pink-100 text-pink-700 border-pink-200',
  PE: 'bg-orange-100 text-orange-700 border-orange-200',
}

const CURRENT_WEEK = 8
const TERM_WEEKS = 10

const AI_TOPICS: Record<string, string[]> = {
  Maths: ['Fractions and Equivalent Decimals', 'Place Value to Millions', 'Multiplication Strategies', 'Data and Statistics', 'Geometry: 2D Shapes'],
  Science: ['States of Matter', 'Forces and Motion', 'Living Things and Ecosystems', 'Earth and Space', 'Light and Sound'],
  English: ['Narrative Writing Techniques', 'Persuasive Texts', 'Reading Comprehension Strategies', 'Grammar and Punctuation', 'Poetry and Figurative Language'],
  HSIE: ['Australian Communities', 'Local Government', 'Cultural Diversity', 'Environment and Sustainability', 'Economics and Work'],
  'Creative Arts': ['Colour Theory and Mixing', 'Sculpture and 3D Art', 'Drama: Storytelling', 'Music Composition Basics', 'Digital Art'],
  PE: ['Team Sports Strategies', 'Athletics: Running Techniques', 'Swimming and Water Safety', 'Gymnastics Fundamentals', 'Yoga and Mindfulness'],
}

const AI_GOALS: Record<string, string> = {
  Maths: 'Students will convert between fractions and decimals and apply these in real-world contexts.',
  Science: 'Students will identify and explain the properties of solids, liquids, and gases through hands-on investigation.',
  English: 'Students will plan and write a structured narrative using descriptive language and varied sentence structures.',
  HSIE: 'Students will analyse the roles of community groups and their contributions to local society.',
  'Creative Arts': 'Students will demonstrate understanding of colour relationships by creating a mixed-media artwork.',
  PE: 'Students will demonstrate correct technique and sportsmanship in team-based physical activities.',
}

const TIME_SLOTS = ['9:00–10:00', '10:30–11:30', '13:00–14:00', '14:15–15:00']

interface WeekItem { subject: string; topic: string; learningGoal: string; class_work?: string }
interface SavedEntry { topic: string; learningGoal: string }
interface AIResult {
  summary: string
  deepDive: string
  tiktoks: { title: string; creator: string; views: string; url?: string }[]
}
type AIStatus = 'idle' | 'processing' | 'done'

interface Props {
  classId: string;
  subject: string;
  onSubjectChange?: (s: string) => void;
  aiRunningRef?: React.MutableRefObject<boolean>;
}

// ── Mock AI content ──────────────────────────────────────────────────────────

function generateAIResult(subject: string, topic: string): AIResult {
  const summaries: Record<string, string> = {
    Maths: `This week's lesson on "${topic}" builds number fluency and critical thinking. Students use visual models and manipulatives to bridge abstract concepts with concrete understanding, solving real-world problems through collaborative practice.`,
    Science: `"${topic}" develops key inquiry skills. Through hands-on experiments, students observe how forces, matter, or living systems behave — connecting classroom learning to everyday phenomena.`,
    English: `The "${topic}" unit deepens literacy through purposeful reading and writing. Students analyse mentor texts, identify structural features, and apply them in their own compositions using discussion and peer reflection.`,
    HSIE: `"${topic}" builds civic understanding and cultural awareness. Students explore community structures, decision-making processes, and how individuals contribute to society using primary sources and case studies.`,
    'Creative Arts': `"${topic}" invites students to express ideas through a specific art form. They develop technique, artistic vocabulary, and self-expression — with peer feedback to refine work.`,
    PE: `"${topic}" builds physical literacy, teamwork, and personal best. Students practise fundamental movement skills in structured game contexts, focusing on fair play and communication.`,
  }
  const deepDives: Record<string, string> = {
    Maths: `**Why it matters:** Number fluency underpins all future maths (NSW MA3-RN-01).\n**Misconceptions:** Students confuse the denominator's role in fractions.\n**Differentiation:** Extend with open problems ("find all fractions between 0.3 and 0.4"); support with fraction walls.\n**Cross-curriculum:** Financial literacy, Science measurement.`,
    Science: `**Why it matters:** Inquiry skills transfer across all STEM disciplines.\n**Misconceptions:** Heavier objects don't always fall faster.\n**Differentiation:** Gifted students design their own experiments; others use scaffolded lab sheets.\n**Cross-curriculum:** Maths (data, measurement), Technology (engineering design).`,
    English: `**Why it matters:** Narrative writing assessed in Stage 3 NAPLAN and HS transitions.\n**Misconceptions:** Students over-use dialogue, under-develop setting.\n**Differentiation:** Advanced writers explore subtext; emerging writers use graphic organisers.\n**Cross-curriculum:** HSIE (persuasive letters), Creative Arts (story into drama).`,
    HSIE: `**Why it matters:** Civic participation builds engaged future citizens.\n**Key vocab:** democracy, council, sustainability, cultural identity.\n**Differentiation:** Visual timelines for spatial learners; debate for verbal learners.\n**Cross-curriculum:** English (persuasive writing), Creative Arts (cultural artefacts).`,
    'Creative Arts': `**Why it matters:** Art develops visual literacy and emotional regulation.\n**Technique focus:** Blending, proportion, compositional balance.\n**Differentiation:** Open briefs for independent learners; structured constraints for scaffolded learners.\n**Cross-curriculum:** Science (colour spectrum, sound waves), Maths (symmetry).`,
    PE: `**Why it matters:** Physical activity improves cognition, wellbeing, and social skills.\n**Safety:** Adequate warm-up, spacing, and mobility modifications.\n**Differentiation:** Modify rules by skill level; create leadership roles for advanced students.\n**Cross-curriculum:** Science (body systems), Maths (scoring, statistics).`,
  }
  const tiktoks: Record<string, AIResult['tiktoks']> = {
    Maths: [
      { title: 'Fractions explained with pizza — Year 5 style', creator: '@mathwithms_jones', views: '1.2M' },
      { title: 'Why decimals and fractions are the same thing', creator: '@numberguru', views: '830K' },
      { title: 'Mental maths tricks kids actually use', creator: '@maths_hacks', views: '2.1M' },
    ],
    Science: [
      { title: 'States of matter experiment with oobleck', creator: '@sciencekids_au', views: '3.4M' },
      { title: 'Forces in everyday life — dropping things', creator: '@physicsforkids', views: '910K' },
      { title: 'Build a simple circuit at home', creator: '@stemstarters', views: '1.7M' },
    ],
    English: [
      { title: 'How to write a story opening that hooks readers', creator: '@writingcoach_edu', views: '2.8M' },
      { title: 'Persuasive writing — 3 tricks that work', creator: '@literacylane', views: '1.5M' },
      { title: 'Vocabulary games for Year 5 & 6', creator: '@wordwizards_edu', views: '990K' },
    ],
    HSIE: [
      { title: 'How local councils actually work', creator: '@civicsforschool', views: '450K' },
      { title: 'Australian cultural diversity explained simply', creator: '@social_studies_au', views: '670K' },
      { title: 'What is sustainability? Kid-friendly explainer', creator: '@greenteacher_au', views: '1.1M' },
    ],
    'Creative Arts': [
      { title: 'Colour wheel mixing — satisfying art', creator: '@artteacher.claire', views: '4.2M' },
      { title: 'Easy sculpture technique with newspaper', creator: '@sculptforkids', views: '2.3M' },
      { title: '5-minute drama warm-up games for class', creator: '@dramagames_edu', views: '880K' },
    ],
    PE: [
      { title: 'Tag game variations for PE lessons', creator: '@pe_teacher_au', views: '1.8M' },
      { title: 'Yoga for kids — 10 minute flow', creator: '@kidsyoga_official', views: '5.1M' },
      { title: 'Athletics drills that feel like games', creator: '@runningcoachkids', views: '1.3M' },
    ],
  }
  const suggestions: Record<string, string[]> = {
    Maths: [
      '🎮 Play "Fraction War" card game — compare fractions with a family member.',
      '🛒 Supermarket task: find sale items and calculate fraction/decimal prices.',
      '🍕 Cook a recipe together and halve or double the ingredients.',
      '📏 Measure furniture at home; record lengths as both decimals and fractions.',
    ],
    Science: [
      '🧊 Freeze/melt experiment: observe water changing states and record findings.',
      '🪂 Drop test: compare fall times of different objects from the same height.',
      '🌱 Grow a seed in a cup and track growth weekly.',
      '🔦 Shadow investigation: trace shadows at different times of day.',
    ],
    English: [
      '📖 Read together 15 min/night — child retells the story in their own words.',
      '📝 Family letter: write a persuasive note to change a household rule.',
      '🎙️ Record a "book review" on the phone — practice oral language.',
      '📰 Create a mini newspaper front page about a family event.',
    ],
    HSIE: [
      '🗺️ Map your neighbourhood — identify community services nearby.',
      '🏛️ Browse your local council website and find one upcoming decision.',
      '👨‍👩‍👧 Family culture box: share one object that represents your heritage.',
      '♻️ Sustainability audit: count plastic items used in one day at home.',
    ],
    'Creative Arts': [
      '🎨 Colour mixing station: mix primaries to discover all secondaries.',
      '🗞️ Papier-mâché a favourite animal using newspaper.',
      '🎭 Act out a story scene — record it for class sharing.',
      '🎵 Compose a 4-beat rhythm using household objects.',
    ],
    PE: [
      '🏃 Family walk/jog: 20 minutes, track steps together.',
      '⚽ Throwing/catching in the backyard — count personal bests.',
      '🧘 Follow a 10-min yoga video on YouTube as a family.',
      '🏅 Set a weekly movement goal and track with a chart.',
    ],
  }
  const bonding: Record<string, { name: string; description: string }[]> = {
    Maths: [
      { name: 'Timezone Arcade', description: 'Children calculate scores, change, and compare values with real money.' },
      { name: 'Farmers Market', description: 'Practice fractions with real purchases: weigh, split costs, calculate discounts.' },
      { name: 'Escape Room Jr.', description: 'Team puzzle-solving builds logical thinking in a fun, low-stakes environment.' },
    ],
    Science: [
      { name: 'National Park Walk', description: 'Observe ecosystems firsthand — identify plants, insects, and habitats.' },
      { name: 'Science Centre / Planetarium', description: 'Interactive exhibits on forces, light, and earth science.' },
      { name: 'Beach or Rock Pool', description: 'Study living things and water properties in a real outdoor context.' },
    ],
    English: [
      { name: 'Local Library Story Time', description: 'Explore narrative techniques through author events and book clubs.' },
      { name: 'Community Theatre', description: 'Watch live performance and discuss narrative structure and character.' },
      { name: 'Bookshop Visit', description: 'Children select their own book — builds reading agency and writing inspiration.' },
    ],
    HSIE: [
      { name: 'Council Chambers Open Day', description: 'See civic infrastructure firsthand — many councils offer school holiday tours.' },
      { name: 'Cultural Festival or Museum', description: 'Experience community stories and artefacts directly.' },
      { name: 'Volunteering Day', description: 'Community clean-up or food bank — direct experience of civic participation.' },
    ],
    'Creative Arts': [
      { name: 'Art Gallery Visit', description: 'Explore colour, composition, and artistic expression across styles and periods.' },
      { name: 'Ceramics Workshop', description: 'Hands-on studio class builds technique and creative confidence in a new medium.' },
      { name: 'Open Mic / School Concert', description: 'Builds music appreciation and stage confidence through live performance.' },
    ],
    PE: [
      { name: 'Local Parkrun (kids)', description: '2km timed run in a community setting — builds fitness and goal-setting.' },
      { name: 'Rock Climbing Gym', description: 'Full-body movement and problem-solving for kinesthetic learners.' },
      { name: 'Family Bike Trail', description: 'Map the route, track distance, and discuss personal best times.' },
    ],
  }
  const s = subject in summaries ? subject : 'Maths'
  return {
    summary: summaries[s],
    deepDive: deepDives[s],
    tiktoks: tiktoks[s] ?? tiktoks.Maths,
  }
}

// ── HITL Popup ───────────────────────────────────────────────────────────────

interface HitlProps {
  item: WeekItem
  result: AIResult
  gcData: ClassroomCourseData | null
  classId: string
  weekId: string
  onClose: () => void
  onResultUpdate: (updated: AIResult) => void
}

const parseSafeJSON = (str: string) => {
  try {
    const cleaned = str.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

function HitlPopup({ item, result, gcData, classId, weekId, onClose, onResultUpdate }: HitlProps) {
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState<Record<string, string>>({})
  const [regenLoading, setRegenLoading] = useState<string | null>(null)
  const { getToken } = useAuth()
  const [localResult, setLocalResult] = useState<AIResult>(result)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)

  const relatedMaterials = gcData?.materials.filter(m => m.week_id === weekId) ?? []
  const relatedAssignments = gcData?.assignments.filter(a => a.week_id === weekId) ?? []

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const token = await getToken()
      const res = await fetch(`${BASE_URL}/api/teacher/classes/${classId}/topics/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          week_id: weekId,
          subject: item.subject,
          topic: item.topic,
          summary: localResult.summary,
          deepDive: localResult.deepDive,
          tiktoks: localResult.tiktoks,
          class_work: item.class_work || ""
        })
      })
      if (!res.ok) throw new Error("Failed to publish")
      setPublishSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setIsPublishing(false)
    }
  }

  const regen = async (section: string, prompt: string) => {
    setRegenLoading(section)
    setActiveChat(null)

    try {
      const token = await getToken()
      // Mapping previous AI response cleanly depending on the section
      const previous_ai_response = typeof localResult[section as keyof AIResult] === 'string'
        ? localResult[section as keyof AIResult]
        : JSON.stringify(localResult[section as keyof AIResult])

      const res = await fetch(`${BASE_URL}/api/teacher/classes/${classId}/topics/ai-regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          section,
          subject: item.subject,
          topic: item.topic,
          class_work: item.class_work || "",
          previous_ai_response,
          user_requirement: prompt
        })
      })
      const data = await res.json()

      setLocalResult(prev => {
        const next = { ...prev }
        // Update ONLY the specified section mapping with the new result
        if (section === 'summary') next.summary = data.result
        if (section === 'deepDive') next.deepDive = data.result
        if (section === 'tiktoks') next.tiktoks = data.result
        return next
      })
      // Flush new state upward
      onResultUpdate({ ...localResult, [section as keyof AIResult]: data.result })
    } catch (e) {
      console.error("Agent Regeneration Error", e)
    } finally {
      setRegenLoading(null)
    }
  }

  const renderSectionCard = (
    id: string, title: string, icon: string, children: React.ReactNode
  ) => {
    const isActive = activeChat === id
    const isLoading = regenLoading === id
    return (
      <div
        className={`rounded-2xl border transition-all ${isActive ? 'border-violet-300 shadow-md' : 'border-slate-200'} bg-white/80`}
      >
        <div
          className="flex items-center justify-between px-4 pt-4 pb-2 cursor-pointer"
          onClick={() => setActiveChat(isActive ? null : id)}
        >
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>{icon}</span> {title}
          </span>
          <MessageSquare size={12} className={isActive ? 'text-violet-500' : 'text-slate-300'} />
        </div>

        <div className="px-4 pb-3">
          {isLoading ? (
            <div className="space-y-2 animate-pulse py-2">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
              <div className="h-3 bg-slate-100 rounded w-3/5" />
              <p className="text-[10px] text-violet-400 mt-2 font-medium animate-pulse">AI is regenerating…</p>
            </div>
          ) : children}
        </div>

        {isActive && !isLoading && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
            <p className="text-[10px] text-slate-400">Ask AI to regenerate this section:</p>
            <div className="flex gap-2">
              <input
                value={chatInput[id] ?? ''}
                onChange={e => setChatInput(prev => ({ ...prev, [id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && chatInput[id]?.trim() && regen(id, chatInput[id])}
                placeholder="e.g. Make it simpler for parents…"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-violet-300 bg-white"
              />
              <button
                onClick={() => chatInput[id]?.trim() && regen(id, chatInput[id])}
                disabled={!chatInput[id]?.trim()}
                className="px-3 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-40 flex items-center gap-1 text-xs font-semibold"
              >
                <Send size={11} /> Gen
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl h-[90vh] backdrop-blur-xl bg-white/95 border border-white/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${SUBJECT_COLORS[item.subject] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {item.subject}
            </span>
            <div>
              <p className="font-bold text-slate-800 text-sm">{item.topic}</p>
              <p className="text-[10px] text-slate-400">Human-in-the-Loop Review · Week {CURRENT_WEEK}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Body — two halves */}
        <div className="flex flex-1 min-h-0 divide-x divide-slate-100">

          {/* LEFT — Teacher's curriculum */}
          <div className="w-2/5 shrink-0 overflow-y-auto px-6 py-5 space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">📋 Curriculum Context</p>

            {/* Topic section */}
            <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-5 space-y-4">
              <div className="space-y-1.5 text-center">
                <p className="text-sm font-bold text-slate-800">{item.topic}</p>
                {item.learningGoal && (
                  <div className="bg-white/60 p-3 rounded-xl border border-indigo-100/50 text-left">
                    <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Learning Goal</p>
                    <p className="text-xs text-slate-700 leading-relaxed italic">{item.learningGoal}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-indigo-100/30">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Lesson Details</p>
                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {item.class_work || (relatedMaterials.length > 0 ? relatedMaterials[0].description : "No manual lesson plan details provided in Google Classroom.")}
                </div>
              </div>

              {relatedMaterials.length > 1 && (
                <div className="pt-3 border-t border-indigo-100/30">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Additional Materials</p>
                  <div className="space-y-1.5">
                    {relatedMaterials.slice(1).map(m => (
                      <div key={m.id} className="text-[10px] font-medium text-slate-500 bg-white/40 px-2 py-1.5 rounded-lg border border-indigo-50/50">
                        📎 {m.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assignments section */}
            <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-5 space-y-4">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList size={10} /> Homework
              </p>

              {relatedAssignments.length > 0 ? (
                <div className="space-y-3">
                  {relatedAssignments.map(a => (
                    <div key={a.id} className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-800">{a.title}</p>
                      {a.description && <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{a.description}</p>}
                      {a.due_date && (
                        <p className="text-[9px] font-semibold text-amber-600 bg-amber-100/40 px-2 py-0.5 rounded-full inline-block">
                          Due: {new Date(a.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific homework assignments found for this topic.</p>
              )}
            </div>
          </div>

          {/* RIGHT — AI results */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              🤖 AI Analysis — click any section to regenerate
            </p>

            {/* Summary */}
            {renderSectionCard("summary", "Summary for Parents", "📝", (
              (() => {
                const parsed = parseSafeJSON(localResult.summary)
                if (parsed && (parsed.essence || parsed.example)) {
                  return (
                    <div className="space-y-2.5">
                      {parsed.essence && <p className="text-xs text-slate-800 font-semibold leading-relaxed">{parsed.essence}</p>}
                      {parsed.example && <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl italic">💡 <strong>Example:</strong> {parsed.example}</p>}
                    </div>
                  )
                }
                return <p className="text-xs text-slate-600 leading-relaxed">{localResult.summary}</p>
              })()
            ))}

            {/* Deep Dive */}
            {renderSectionCard("deepDive", "Deep Dive", "🔍", (
              (() => {
                const parsed = parseSafeJSON(localResult.deepDive)
                if (parsed && (parsed.core_concept || parsed.key_vocabulary || parsed.why_this_matters)) {
                  return (
                    <div className="space-y-4">
                      {parsed.core_concept && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Sparkles size={10} className="text-violet-400" /> Core Concept</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{parsed.core_concept}</p>
                        </div>
                      )}
                      {parsed.key_vocabulary && parsed.key_vocabulary.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><BookOpen size={10} className="text-violet-400" /> Key Vocabulary</p>
                          <ul className="space-y-1.5">
                            {parsed.key_vocabulary.map((v: any, i: number) => (
                              <li key={i} className="text-xs text-slate-700 leading-snug"><span className="font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded mr-1">{v.term}</span> {v.definition}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parsed.why_this_matters && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Target size={10} className="text-violet-400" /> Why This Matters</p>
                          <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-2 rounded-lg border border-slate-100">{parsed.why_this_matters}</p>
                        </div>
                      )}
                    </div>
                  )
                }
                return (
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line space-y-1">
                    {localResult.deepDive.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('**') ? 'font-semibold text-slate-800' : ''}>
                        {line.replace(/\*\*/g, '')}
                      </p>
                    ))}
                  </div>
                )
              })()
            ))}

            {/* TikTok Videos */}
            {renderSectionCard("tiktoks", "TikTok Videos Found", "🎬", (
              <div className="space-y-2">
                {localResult.tiktoks.map((t, i) => (
                  <div key={i}
                    onClick={() => t.url && t.url !== '#' && window.open(t.url, '_blank')}
                    className="flex items-start gap-2.5 bg-slate-50 rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-black">TT</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{t.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.creator} · {t.views} views</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 shrink-0 gap-3">
          <button onClick={onClose} disabled={isPublishing} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || publishSuccess}
            className={`px-6 py-2 rounded-xl text-white text-sm font-semibold shadow-md transition-all flex items-center gap-2
              ${publishSuccess ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 disabled:opacity-60'}`}
          >
            {publishSuccess ? (
              <><CheckCircle size={15} /> Published!</>
            ) : isPublishing ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Publishing…</>
            ) : (
              <><Send size={15} /> Approve & Publish to Parents</>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── UploadModal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, classId, onSaved }: { onClose: () => void; classId: string; onSaved: () => void }) {
  const [week, setWeek] = useState('1')
  const [subject, setSubject] = useState<string>(SUBJECTS[0])
  const [topic, setTopic] = useState('')
  const [goal, setGoal] = useState('')
  const [generatingTopic, setGeneratingTopic] = useState(false)
  const [generatingGoal, setGeneratingGoal] = useState(false)

  const aiGenerateTopic = () => {
    setGeneratingTopic(true)
    const options = AI_TOPICS[subject] ?? AI_TOPICS.Maths
    const target = options[Math.floor(Math.random() * options.length)]
    let i = 0; setTopic('')
    const iv = setInterval(() => {
      i += 2; setTopic(target.slice(0, i))
      if (i >= target.length) { clearInterval(iv); setTopic(target); setGeneratingTopic(false) }
    }, 20)
  }

  const aiGenerateGoal = () => {
    setGeneratingGoal(true)
    const target = AI_GOALS[subject] ?? AI_GOALS.Maths
    let i = 0; setGoal('')
    const iv = setInterval(() => {
      i += 2; setGoal(target.slice(0, i))
      if (i >= target.length) { clearInterval(iv); setGoal(target); setGeneratingGoal(false) }
    }, 15)
  }

  const handleSave = () => {
    if (!topic.trim()) return
    const key = `curriculum_${classId}_week_${week}`
    const existing: Record<string, SavedEntry> = JSON.parse(localStorage.getItem(key) ?? '{}')
    existing[subject] = { topic, learningGoal: goal }
    localStorage.setItem(key, JSON.stringify(existing))
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/90 border border-white/60 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800">Upload Curriculum Entry</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Week</label>
              <input type="number" min="1" max="20" value={week} onChange={e => setWeek(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 bg-white">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Topic</label>
              <button type="button" onClick={aiGenerateTopic} disabled={generatingTopic}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50">
                <Sparkles size={9} /> {generatingTopic ? 'Generating…' : 'AI Generate'}
              </button>
            </div>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions and Decimals"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Learning Goal</label>
              <button type="button" onClick={aiGenerateGoal} disabled={generatingGoal}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50">
                <Sparkles size={9} /> {generatingGoal ? 'Generating…' : 'AI Generate'}
              </button>
            </div>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Students will be able to…" rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={!topic.trim()}
            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
            Save Entry
          </button>
        </div>
      </div>
    </div>
  )
}

// ── WeekEditor ───────────────────────────────────────────────────────────────

function WeekEditor({
  week, items, classId, onSaved, aiStatus, onSubjectClick,
}: {
  week: number; items: WeekItem[]; classId: string
  onSaved: (subj: string, topic: string, goal: string) => void
  aiStatus?: Record<string, AIStatus>
  onSubjectClick?: (item: WeekItem, weekNum: number) => void
}) {
  const [editSubj, setEditSubj] = useState<string | null>(null)
  const [topicVal, setTopicVal] = useState('')
  const [goalVal, setGoalVal] = useState('')
  const [savedSubj, setSavedSubj] = useState<string | null>(null)
  const [generatingField, setGeneratingField] = useState<'topic' | 'goal' | null>(null)

  const aiGenerate = (field: 'topic' | 'goal', subj: string) => {
    setGeneratingField(field)
    if (field === 'topic') {
      const options = AI_TOPICS[subj] ?? AI_TOPICS.Maths
      const target = options[Math.floor(Math.random() * options.length)]
      let i = 0; setTopicVal('')
      const iv = setInterval(() => {
        i += 2; setTopicVal(target.slice(0, i))
        if (i >= target.length) { clearInterval(iv); setTopicVal(target); setGeneratingField(null) }
      }, 20)
    } else {
      const target = AI_GOALS[subj] ?? AI_GOALS.Maths
      let i = 0; setGoalVal('')
      const iv = setInterval(() => {
        i += 2; setGoalVal(target.slice(0, i))
        if (i >= target.length) { clearInterval(iv); setGoalVal(target); setGeneratingField(null) }
      }, 15)
    }
  }

  const startEdit = (item: WeekItem) => { setEditSubj(item.subject); setTopicVal(item.topic); setGoalVal(item.learningGoal) }

  const handleSave = (subj: string) => {
    const key = `curriculum_${classId}_week_${week}`
    const existing: Record<string, SavedEntry> = JSON.parse(localStorage.getItem(key) ?? '{}')
    existing[subj] = { topic: topicVal, learningGoal: goalVal }
    localStorage.setItem(key, JSON.stringify(existing))
    onSaved(subj, topicVal, goalVal)
    setSavedSubj(subj); setEditSubj(null)
    setTimeout(() => setSavedSubj(null), 2000)
  }

  return (
    <div className="px-5 pb-4 space-y-3 border-t border-slate-100">
      {items.map(({ subject: subj, topic, learningGoal, class_work }) => {
        const isEditing = editSubj === subj
        const justSaved = savedSubj === subj
        const status: AIStatus = aiStatus?.[subj] ?? 'idle'
        const isDone = status === 'done'
        const isProcessing = status === 'processing'

        const statusBorder = isProcessing
          ? 'border-l-4 border-l-red-400 bg-red-50/40'
          : isDone
            ? 'border-l-4 border-l-emerald-400 bg-emerald-50/30'
            : ''

        return (
          <div key={subj} className={`pt-3 rounded-xl transition-all ${statusBorder}`}>
            <div className="flex items-start gap-3 px-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${SUBJECT_COLORS[subj] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {subj}
              </span>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input value={topicVal} onChange={e => setTopicVal(e.target.value)}
                        className="w-full px-3 py-1.5 pr-24 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-300" placeholder="Topic" />
                      <button type="button" onClick={() => aiGenerate('topic', subj)} disabled={generatingField !== null}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50">
                        <Sparkles size={8} /> AI
                      </button>
                    </div>
                    <div className="relative">
                      <textarea value={goalVal} onChange={e => setGoalVal(e.target.value)} rows={2}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-300 resize-none" placeholder="Learning goal" />
                      <button type="button" onClick={() => aiGenerate('goal', subj)} disabled={generatingField !== null}
                        className="absolute right-2 top-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50">
                        <Sparkles size={8} /> AI
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(subj)} className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600">
                        <Save size={11} /> Save
                      </button>
                      <button onClick={() => setEditSubj(null)} className="px-3 py-1 text-xs font-semibold text-slate-500 rounded-lg hover:bg-slate-100">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{topic}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* AI status badge */}
                        {isProcessing && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                            AI running…
                          </span>
                        )}
                        {isDone && (
                          <button
                            onClick={() => onSubjectClick?.({ subject: subj, topic, learningGoal, class_work }, week)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle size={10} /> Review
                          </button>
                        )}
                        <button onClick={() => startEdit({ subject: subj, topic, learningGoal, class_work })}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                          <Pencil size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                      <CheckCircle size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                      {learningGoal}
                    </p>
                    {justSaved && <p className="text-[10px] text-emerald-500 font-semibold mt-1">Saved ✓</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── LmsModal ─────────────────────────────────────────────────────────────────

const LMS_PROVIDERS = ['Google Classroom', 'Canvas', 'Compass', 'Schoology', 'Microsoft Teams', 'Other']
const LMS_STEPS = ['Connecting to Google Classroom…', 'Fetching materials & assignments…', 'Saving to database…']

function LmsModal({ onClose, onConnected, classId }: { onClose: () => void; onConnected: () => void; classId: string }) {
  const [provider, setProvider] = useState('Google Classroom')
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [error, setError] = useState<string | null>(null)

  const isGoogleClassroom = provider === 'Google Classroom'

  const handleConnect = async () => {
    if (!provider) return
    if (!isGoogleClassroom && (!url.trim() || !key.trim())) return
    setError(null)
    setStep(1)

    try {
      // Step 1 → 2: start request
      await new Promise(r => setTimeout(r, 600))
      setStep(2)

      const res = await fetch(`${BASE_URL}/api/teacher/classroom/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: classId,
          provider,
          token: key.trim(),
        }),
      })

      setStep(3)
      await new Promise(r => setTimeout(r, 400))

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Connection failed' }))
        throw new Error(err.detail || 'Connection failed')
      }

      await res.json() // discard — UI will re-fetch from DB
      setStep(4)
      onConnected()
    } catch (e: any) {
      setStep(0)
      setError(e.message || 'Connection failed. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/90 border border-white/60 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wifi size={15} className="text-blue-500" />
            </div>
            <h2 className="font-bold text-slate-800">Connect to School LMS</h2>
          </div>
          {step < 1 && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
          )}
        </div>

        {step === 4 ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="font-bold text-slate-800">Connected to {provider}!</p>
            <p className="text-xs text-slate-500">Curriculum data has been synced. Your weekly topics are now up to date.</p>
            <button onClick={onClose} className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors">
              Done
            </button>
          </div>
        ) : step >= 1 ? (
          <div className="py-6 space-y-5">
            {LMS_STEPS.map((label, i) => {
              const stepNum = i + 1
              const done = step > stepNum
              const active = step === stepNum
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                    ${done ? 'bg-emerald-500' : active ? 'bg-blue-500' : 'bg-slate-100'}`}>
                    {done ? <CheckCircle size={16} className="text-white" />
                      : active ? <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                        : <div className="w-3 h-3 rounded-full bg-slate-300" />}
                  </div>
                  <span className={`text-sm font-medium ${done ? 'text-emerald-600' : active ? 'text-blue-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">LMS Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {LMS_PROVIDERS.map(p => (
                  <button key={p} type="button" onClick={() => setProvider(p)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors text-left
                      ${provider === p ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300'}`}>
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center ${provider === p ? 'border-blue-500' : 'border-slate-300'}`}>
                      {provider === p && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </div>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                School LMS URL
                {isGoogleClassroom && <span className="ml-1 text-slate-300 normal-case font-normal">(optional for Google Classroom)</span>}
              </label>
              <input value={url} onChange={e => setUrl(e.target.value)}
                placeholder={isGoogleClassroom ? 'classroom.google.com (auto-detected)' : 'e.g. school.instructure.com'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">API Key / Access Token</label>
              <input type="password" value={key} onChange={e => setKey(e.target.value)}
                placeholder={isGoogleClassroom ? 'ya29.… (leave blank to use stored credentials)' : 'Paste your API key here'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300" />
              {isGoogleClassroom && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave blank to use the pre-configured Google credentials on the server.
                </p>
              )}
            </div>
            {error && (
              <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleConnect}
                disabled={!provider || (!isGoogleClassroom && (!url.trim() || !key.trim()))}
                className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
                <Wifi size={14} /> Connect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── GcItem ───────────────────────────────────────────────────────────────────

function GcItem({ item, expanded, onToggle }: { item: ClassroomItem; expanded: boolean; onToggle: () => void }) {
  const isMaterial = item.type === 'material'
  const dueDateStr = item.due_date
    ? new Date(item.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null
  const createdStr = item.created_time
    ? new Date(item.created_time).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${isMaterial ? 'border-indigo-100 bg-indigo-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
      <button onClick={onToggle} className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-white/40 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isMaterial ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
              {isMaterial ? 'Material' : 'Assignment'}
            </span>
            {dueDateStr && <span className="text-[10px] text-slate-500 font-medium">Due: {dueDateStr}</span>}
            {createdStr && !dueDateStr && <span className="text-[10px] text-slate-400">Posted: {createdStr}</span>}
            {item.max_points && <span className="text-[10px] text-slate-500 font-medium">{item.max_points} pts</span>}
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-1 leading-tight">{item.title}</p>
          {item.submission_summary && (
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Users size={9} /> {item.submission_summary.turned_in}/{item.submission_summary.total} submitted
              </span>
              {item.submission_summary.avg_grade !== null && (
                <span className="text-[10px] text-emerald-600 font-semibold">Avg: {item.submission_summary.avg_grade}/{item.max_points}</span>
              )}
            </div>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t border-white/60 px-4 py-3 space-y-3 bg-white/50">
          {item.description && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Description</p>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{item.description}</pre>
            </div>
          )}
          {item.students.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Student Submissions</p>
              <div className="space-y-1.5">
                {item.students.map(s => (
                  <div key={s.student_id} className="flex items-center gap-3 bg-white/70 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-medium text-slate-700 flex-1">{s.student_name || s.student_id.slice(-6)}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.state === 'RETURNED' ? 'bg-emerald-100 text-emerald-700' :
                      s.state === 'TURNED_IN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>{s.state.replace('_', ' ')}</span>
                    {s.assigned_grade !== null
                      ? <span className="text-xs font-bold text-emerald-600">{s.assigned_grade}/{item.max_points}</span>
                      : s.draft_grade !== null
                        ? <span className="text-xs text-slate-400">Draft: {s.draft_grade}</span>
                        : <span className="text-xs text-slate-300">—</span>}
                    {s.late && <span className="text-[9px] text-rose-500 font-semibold">LATE</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Export ──────────────────────────────────────────────────────────────

export default function CurriculumTab({ classId, subject, onSubjectChange, aiRunningRef: parentAiRunningRef }: Props) {
  const { getToken } = useAuth()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([CURRENT_WEEK]))
  const [toast, setToast] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showLmsModal, setShowLmsModal] = useState(false)
  const [lmsConnected, setLmsConnected] = useState(false)
  const [calendarWeek, setCalendarWeek] = useState(CURRENT_WEEK)
  const [listFilterSubject, setListFilterSubject] = useState<string | null>(null)
  const [expandedCalDay, setExpandedCalDay] = useState<string | null>(null)
  // null = show currentWeekNum; set by calendar click to navigate to a specific week
  const [listWeek, setListWeek] = useState<number | null>(null)
  // Tracks which lesson/homework items are expanded in list view (key = "lesson-{weekId}-{subj}" or "hw-{id}")
  const [expandedListItems, setExpandedListItems] = useState<Set<string>>(new Set())
  const toggleListItem = (key: string) => setExpandedListItems(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n
  })
  const [savedOverrides, setSavedOverrides] = useState<Record<string, Record<string, SavedEntry>>>({})

  // Timetable
  const [timetable, setTimetable] = useState<Record<string, any[]>>({})

  // Curriculum DB state
  const [gcData, setGcData] = useState<ClassroomCourseData | null>(null)
  const [gcLoading, setGcLoading] = useState(false)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [dbWeeklyTopics, setDbWeeklyTopics] = useState<ClassroomWeeklyTopic[]>([])

  // ── Add Lecture editor state ────────────────────────────────────────────────
  const editorRef = useRef<HTMLDivElement>(null)
  const homeworkEditorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [wordCount, setWordCount] = useState(0)
  // Local fallback if no parent ref provided, but we prefer the parent one for stability
  const localAiRunningRef = useRef(false)
  const isAiAgentRunningRef = parentAiRunningRef || localAiRunningRef
  // AbortController to cancel fetches if component unmounts during generation
  const abortControllerRef = useRef<AbortController | null>(null)
  const [homeworkWordCount, setHomeworkWordCount] = useState(0)
  const [editorActiveMenu, setEditorActiveMenu] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState('12pt')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [sourceHtml, setSourceHtml] = useState('')
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [selectedHighlight, setSelectedHighlight] = useState('#FEF3C7')
  const [showAttachModal, setShowAttachModal] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([])
  const [editorDate, setEditorDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [editorCalMonth, setEditorCalMonth] = useState(new Date())
  const [editorSubject, setEditorSubject] = useState(subject === 'All' ? 'Maths' : subject)
  const [editorSubjectList, setEditorSubjectList] = useState(['Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE'])
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)
  const [isCreatingSubject, setIsCreatingSubject] = useState(false)
  const [newSubjectValue, setNewSubjectValue] = useState('')
  const [showAddLecture, setShowAddLecture] = useState(false)
  const [editorTitle, setEditorTitle] = useState('')
  const [submittingLecture, setSubmittingLecture] = useState(false)
  const [editingBlock, setEditingBlock] = useState<LectureBlock | null>(null)

  // ── Lecture blocks (drag-and-drop calendar) ────────────────────────────────
  interface LectureBlock {
    id: string; class_id: string; title: string; subject: string
    content: string; week_id: string | null; day_of_week: number | null; sort_order: number
  }
  interface ConflictInfo {
    draggedId: string; targetId: string; targetWeekId: string; targetDayIdx: number
  }
  const [lectureBlocks, setLectureBlocks] = useState<LectureBlock[]>([])
  const [savingCalendar, setSavingCalendar] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [draggingGcItem, setDraggingGcItem] = useState<ClassroomItem | null>(null)
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<{ day: string, index: number } | null>(null)
  const [dragOverTrash, setDragOverTrash] = useState(false)
  const [trashConfirmInfo, setTrashConfirmInfo] = useState<{ id: string | null; gcItem: ClassroomItem | null } | null>(null)
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null)

  const formatEditorDate = (d: Date) => {
    const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`
  }
  const handleAddSubject = () => {
    const v = newSubjectValue.trim()
    if (v && !editorSubjectList.includes(v)) setEditorSubjectList(prev => [...prev, v])
    if (v) setEditorSubject(v)
    setNewSubjectValue(''); setIsCreatingSubject(false); setShowSubjectPicker(false)
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + ' MB' }))
      setAttachedFiles(prev => [...prev, ...files])
      setShowAttachModal(false)
    }
  }
  const removeFile = (i: number) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))
  const toggleSourceMode = () => {
    if (isSourceMode) { if (editorRef.current) editorRef.current.innerHTML = sourceHtml; setIsSourceMode(false) }
    else { setSourceHtml(editorRef.current?.innerHTML || ''); setIsSourceMode(true) }
  }
  const handleZoom = (delta: number) => setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 2))
  const applyFormat = (command: string, value = '') => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }
  const handleEditorInput = () => {
    const text = editorRef.current?.innerText || ''
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
  }

  // ── Lecture block API helpers ────────────────────────────────────────────────
  const fetchLectureBlocks = useCallback(async (forceRefresh = false) => {
    const cacheKey = `lectureBlocks:${classId}:${subject}`
    if (!forceRefresh) {
      const cached = cacheGet<LectureBlock[]>(cacheKey)
      if (cached) { setLectureBlocks(cached); return }
    }
    try {
      const token = await getToken()
      const url = `${BASE_URL}/api/teacher/classes/${classId}/lecture-blocks${subject === 'All' ? '?all_subjects=true' : ''}`
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        cacheSet(cacheKey, data)
        setLectureBlocks(data)
      }
    } catch { /* silent */ }
  }, [classId, subject, getToken])

  const handleEditBlock = (lb: LectureBlock) => {
    setEditingBlock(lb)
    setEditorTitle(lb.title)
    setEditorSubject(lb.subject)
    setShowAddLecture(true)
    // populate editor content after it renders
    setTimeout(() => {
      const parts = (lb.content || '').split('<!--HOMEWORK_DELIMITER-->')
      if (editorRef.current) {
        editorRef.current.innerHTML = parts[0] || ''
        handleEditorInput()
      }
      if (homeworkEditorRef.current) {
        homeworkEditorRef.current.innerHTML = parts.length > 1 ? parts[1] : ''
        const text = homeworkEditorRef.current.innerText || ''
        setHomeworkWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
      }
    }, 50)
  }

  const handleSubmitLecture = async () => {
    const title = editorTitle.trim() || `${editorSubject} Lecture`
    const lectureHtml = editorRef.current?.innerHTML || ''
    const homeworkHtml = homeworkEditorRef.current?.innerHTML || ''
    const content = lectureHtml + '<!--HOMEWORK_DELIMITER-->' + homeworkHtml

    setSubmittingLecture(true)
    try {
      const token = await getToken()
      if (editingBlock) {
        // UPDATE existing block
        const res = await fetch(`${BASE_URL}/api/teacher/classes/${classId}/lecture-blocks/${editingBlock.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ title, subject: editorSubject, content }),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setLectureBlocks(prev => prev.map(b => b.id === updated.id ? updated : b))
        showToast('✅ Block updated!')
      } else {
        // CREATE new block → goes to queue
        const res = await fetch(`${BASE_URL}/api/teacher/classes/${classId}/lecture-blocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ title, subject: editorSubject, content }),
        })
        if (!res.ok) throw new Error()
        const block = await res.json()
        setLectureBlocks(prev => [...prev, block])
        showToast('✅ Block added to queue!')
      }
      setEditorTitle('')
      setEditingBlock(null)
      if (editorRef.current) editorRef.current.innerHTML = ''
      if (homeworkEditorRef.current) homeworkEditorRef.current.innerHTML = ''
      setWordCount(0)
      setHomeworkWordCount(0)
      setShowAddLecture(false)
    } catch { showToast('❌ Failed to save block') }
    finally { setSubmittingLecture(false) }
  }

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggingId(blockId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragEnd = () => { setDraggingId(null); setDragOverCell(null) }

  const putBlockPosition = async (blockId: string, weekId: string | null, dayIdx: number | null, sortOrder = 0) => {
    try {
      const token = await getToken()
      await fetch(`${BASE_URL}/api/teacher/classes/${classId}/lecture-blocks/${blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ week_id: weekId, day_of_week: dayIdx, sort_order: sortOrder }),
      })
    } catch { /* silent — local state already updated */ }
  }

  const deleteBlock = async (blockId: string) => {
    try {
      const token = await getToken()
      await fetch(`${BASE_URL}/api/teacher/classes/${classId}/lecture-blocks/${blockId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch { /* silent */ }
  }

  const handleDropOnCell = (e: React.DragEvent, weekId: string, dayIdx: number, targetBlockId?: string, insertIndex?: number) => {
    e.preventDefault(); e.stopPropagation();
    setDragOverCell(null); setDragOverBlockId(null); setDragOverIndex(null);

    if (draggingGcItem) {
      // Converting GC Item into a Lecture Block temporarily
      const cleanTitle = draggingGcItem.title.replace(/^\[\d{4}-W\d{2}\]\s*/, '').replace(/^Week\s+\d+:\s*/, '').replace(/\s*—\s*(Lesson Plan|Homework)$/, '').trim()
      const newBlock: LectureBlock = {
        id: `temp-${Date.now()}`,
        class_id: classId as string,
        title: cleanTitle,
        subject: 'General',
        content: `<!--GC_ITEM_ID:${draggingGcItem.id}-->`,
        week_id: weekId,
        day_of_week: dayIdx,
        sort_order: 0,
      }
      setLectureBlocks(prev => {
        let cellBlocks = prev.filter(b => b.week_id === weekId && b.day_of_week === dayIdx).sort((a, b) => a.sort_order - b.sort_order)
        if (insertIndex !== undefined && insertIndex <= cellBlocks.length) cellBlocks.splice(insertIndex, 0, newBlock)
        else cellBlocks.push(newBlock)
        cellBlocks = cellBlocks.map((b, i) => ({ ...b, sort_order: i }))
        return [...prev.filter(b => !(b.week_id === weekId && b.day_of_week === dayIdx)), ...cellBlocks]
      })
      setDraggingGcItem(null)
      return
    }

    if (!draggingId) return

    if (targetBlockId) {
      // Dropped ON a block -> Replace/Stack modal
      setConflictInfo({ draggedId: draggingId, targetId: targetBlockId, targetWeekId: weekId, targetDayIdx: dayIdx })
    } else {
      // Dropped in the cell or between blocks
      setLectureBlocks(prev => {
        let next = [...prev] // Note: In UI we don't delete blocks upon replace directly here, just moving.
        const movingBlock = next.find(b => b.id === draggingId)
        if (!movingBlock) return prev

        // Remove moving block from old position
        next = next.filter(b => b.id !== draggingId)

        // Get blocks in the target cell
        let cellBlocks = next.filter(b => b.week_id === weekId && b.day_of_week === dayIdx).sort((a, b) => a.sort_order - b.sort_order)

        // Re-calculate sorting
        if (insertIndex !== undefined && insertIndex <= cellBlocks.length) {
          cellBlocks.splice(insertIndex, 0, { ...movingBlock, week_id: weekId, day_of_week: dayIdx, sort_order: 0 })
        } else {
          cellBlocks.push({ ...movingBlock, week_id: weekId, day_of_week: dayIdx, sort_order: 0 })
        }

        // Re-assign sort orders to be safe
        cellBlocks = cellBlocks.map((b, i) => ({ ...b, sort_order: i }))

        // Replace cell blocks in the master list
        return [...next.filter(b => !(b.week_id === weekId && b.day_of_week === dayIdx)), ...cellBlocks]
      })
    }
    setDraggingId(null)
  }

  const resolveConflict = (mode: 'replace' | 'stack') => {
    if (!conflictInfo) return
    const { draggedId, targetId, targetWeekId, targetDayIdx } = conflictInfo
    setConflictInfo(null)

    if (mode === 'replace') {
      // UI ONLY: Remove the target block, move the dragged block
      setLectureBlocks(prev => {
        const next = prev.filter(b => b.id !== targetId)
        return next.map(b => b.id === draggedId ? { ...b, week_id: targetWeekId, day_of_week: targetDayIdx, sort_order: 0 } : b)
      })
      showToast('✅ Block replaced (Click Save to finalize)')
    } else {
      // Stack UI ONLY
      setLectureBlocks(prev => prev.map(b => {
        if (b.id === draggedId) return { ...b, week_id: targetWeekId, day_of_week: targetDayIdx, sort_order: 0 }
        if (b.id === targetId) return { ...b, week_id: targetWeekId, day_of_week: targetDayIdx, sort_order: 1 }
        return b
      }))
      showToast('✅ Blocks stacked (Click Save to finalize)')
    }
  }

  const saveCalendar = async () => {
    setSavingCalendar(true)
    try {
      const token = await getToken()
      const res = await fetch(`${BASE_URL}/api/teacher/classes/${classId}/lecture-blocks/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ blocks: lectureBlocks }),
      })
      if (!res.ok) throw new Error()
      showToast('✅ Calendar saved!')
    } catch { showToast('❌ Save failed') }
    finally { setSavingCalendar(false) }
  }

  // AI Agent state
  const [aiRunning, setAiRunning] = useState(false)
  const [aiSubjectStatus, setAiSubjectStatus] = useState<Record<string, AIStatus>>(
    () => cacheGet<Record<string, AIStatus>>(`aiStatus:${classId}`) ?? {}
  )
  const [aiResults, setAiResults] = useState<Record<string, AIResult>>(
    () => cacheGet<Record<string, AIResult>>(`aiResults:${classId}`) ?? {}
  )
  const [hitlItem, setHitlItem] = useState<{ item: WeekItem; result: AIResult; weekId: string } | null>(null)

  const fetchCurriculumData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `curriculum:${classId}:${subject}`
    if (!forceRefresh) {
      const cached = cacheGet<ClassroomCourseData>(cacheKey)
      if (cached) {
        setGcData(cached)
        if (cached.weekly_topics) setDbWeeklyTopics(cached.weekly_topics)
        setGcLoading(false)
        return
      }
    }
    setGcLoading(true)
    try {
      const token = await getToken()
      const url = `${BASE_URL}/api/teacher/classes/${classId}/curriculum${subject === 'All' ? '?all_subjects=true' : ''}`
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load')
      const data: ClassroomCourseData = await res.json()
      cacheSet(cacheKey, data)
      setGcData(data)
      if (data.weekly_topics) {
        setDbWeeklyTopics(data.weekly_topics)
        // Jump calendar to current week
        const todayId = (() => {
          const d = new Date()
          const year = d.getFullYear()
          const jan1 = new Date(year, 0, 1)
          const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
          return `${year}-W${String(weekNum).padStart(2, '0')}`
        })()
        const sorted = [...data.weekly_topics].sort((a, b) => a.week - b.week)
        let cur = sorted[0]?.week ?? CURRENT_WEEK
        for (const wt of sorted) {
          if (wt.week_id && wt.week_id <= todayId) cur = wt.week
        }
        setCalendarWeek(cur)
      }
    } catch { /* silent */ } finally { setGcLoading(false) }
  }, [classId, subject, getToken])

  const handleLmsConnected = useCallback(() => {
    // Sync done — clear cache and re-fetch fresh data from DB
    cacheDelete(`curriculum:${classId}:${subject}`)
    cacheDelete(`lectureBlocks:${classId}:${subject}`)
    fetchCurriculumData(true)
  }, [fetchCurriculumData, classId, subject])

  useEffect(() => {
    fetch('/api/timetable').then(r => r.json()).then(setTimetable).catch(console.error)
  }, [])

  // Auto-load curriculum + lecture blocks from DB on mount
  useEffect(() => {
    fetchCurriculumData()
    // TODO: support fetching all blocks if needed
    fetchLectureBlocks()

    return () => {
      // Cleanup: Abort any pending AI generation fetches on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
        isAiAgentRunningRef.current = false
      }
    }
  }, [classId, subject])

  useEffect(() => {
    setListFilterSubject(null)
    const overrides: Record<string, Record<string, SavedEntry>> = {}
    for (let w = 1; w <= 20; w++) {
      const raw = localStorage.getItem(`curriculum_${classId}_week_${w}`)
      if (raw) { try { overrides[String(w)] = JSON.parse(raw) } catch { /* ignore */ } }
    }
    setSavedOverrides(overrides)
  }, [classId, subject])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev => { const n = new Set(prev); n.has(week) ? n.delete(week) : n.add(week); return n })
  }

  const handleItemSaved = (week: number, subj: string, topic: string, goal: string) => {
    setSavedOverrides(prev => ({
      ...prev,
      [String(week)]: { ...(prev[String(week)] ?? {}), [subj]: { topic, learningGoal: goal } },
    }))
    showToast('Saved ✓')
  }

  // Build week → subjects map + week name map
  const weekMap: Record<number, WeekItem[]> = {}
  const weekNameMap: Record<number, string> = {}
  const topicsToRender = dbWeeklyTopics.length > 0 ? dbWeeklyTopics : []
  topicsToRender.forEach(wt => {
    if (wt.week_name) weekNameMap[wt.week] = wt.week_name
    if (subject !== 'All' && wt.subject !== subject) return
    if (!weekMap[wt.week]) weekMap[wt.week] = []
    const override = savedOverrides[String(wt.week)]?.[wt.subject]
    weekMap[wt.week].push({
      subject: wt.subject,
      topic: override?.topic ?? wt.topic,
      learningGoal: override?.learningGoal ?? wt.learningGoal,
      class_work: wt.class_work,
    })
  })
  const weeks = Object.keys(weekMap).map(Number).sort((a, b) => a - b)

  // Compute current week from today's ISO week vs week_ids (format "YYYY-WXX")
  const todayWeekId = (() => {
    const d = new Date()
    const year = d.getFullYear()
    const jan1 = new Date(year, 0, 1)
    const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    return `${year}-W${String(weekNum).padStart(2, '0')}`
  })()
  const currentWeekNum = (() => {
    const sorted = dbWeeklyTopics.slice().sort((a, b) => a.week - b.week)
    if (!sorted.length) return CURRENT_WEEK
    // Find last topic whose week_id <= today's week
    let found = sorted[0].week
    for (const wt of sorted) {
      if (wt.week_id && wt.week_id <= todayWeekId) found = wt.week
    }
    return found
  })()

  // Compute total week count and start-date map from DB topics
  const totalWeeks = weeks.length > 0 ? Math.max(...weeks) : TERM_WEEKS

  // Build weekNum → Monday Date map using ISO week_id ("YYYY-WXX")
  const weekStartDateMap: Record<number, Date> = {}
  dbWeeklyTopics.forEach(wt => {
    if (wt.week_id && !weekStartDateMap[wt.week]) {
      const [yearStr, weekStr] = wt.week_id.split('-W')
      const year = parseInt(yearStr, 10)
      const week = parseInt(weekStr, 10)
      // ISO week rule: Jan 4th is always in week 1
      const jan4 = new Date(year, 0, 4)
      const jan4Day = jan4.getDay() || 7 // Mon=1..Sun=7
      const week1Mon = new Date(jan4)
      week1Mon.setDate(jan4.getDate() - jan4Day + 1)
      const monday = new Date(week1Mon)
      monday.setDate(week1Mon.getDate() + (week - 1) * 7)
      weekStartDateMap[wt.week] = monday
    }
  })

  // ── AI Agent run ────────────────────────────────────────────────────────────
  const runAiAgent = useCallback(async () => {
    if (isAiAgentRunningRef.current) {
      console.log("AI Agent is already running, skipping trigger.")
      return
    }
    let currentWeekItems = weekMap[currentWeekNum] ?? []
    // Filter by local List View subject if one is set
    if (listFilterSubject) {
      currentWeekItems = currentWeekItems.filter(item => item.subject === listFilterSubject)
    }

    if (!currentWeekItems.length) return

    isAiAgentRunningRef.current = true
    setAiRunning(true)
    // Expand current week
    setExpandedWeeks(prev => new Set([...prev, currentWeekNum]))

    // Create a new AbortController for this run
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      for (const item of currentWeekItems) {
        // Check if we were aborted between subjects
        if (controller.signal.aborted) break

        const key = item.subject
        setAiSubjectStatus(prev => {
          const next = { ...prev, [key]: 'processing' as AIStatus }
          cacheSet(`aiStatus:${classId}`, next)
          return next
        })
        try {
          const token = await getToken()
          const res = await fetch(`${BASE_URL}/api/teacher/classes/${classId}/topics/ai-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              week: currentWeekNum,
              subject: item.subject,
              topic: item.topic,
              learningGoal: item.learningGoal,
              class_work: item.class_work,
            }),
            signal: controller.signal // Link to abort signal
          })

          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
          const result = await res.json()
          setAiResults(prev => {
            const next = { ...prev, [key]: result }
            cacheSet(`aiResults:${classId}`, next)
            return next
          })
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('AI generation fetch was aborted.')
            return // Stop everything if aborted
          }
          console.error('Failed to generate AI data for', item.subject, err)
          const fb = { summary: 'Error generating', deepDive: 'Please try again manually.', tiktoks: [] }
          setAiResults(prev => {
            const next = { ...prev, [key]: fb }
            cacheSet(`aiResults:${classId}`, next)
            return next
          })
        }
        setAiSubjectStatus(prev => {
          const next = { ...prev, [key]: 'done' as AIStatus }
          cacheSet(`aiStatus:${classId}`, next)
          return next
        })
      }
      if (!controller.signal.aborted) {
        showToast('✅ AI analysis complete for this week!')
      }
    } finally {
      // Only clear the running flag if this specific run finished (wasn't replaced/aborted by another mount)
      if (abortControllerRef.current === controller) {
        isAiAgentRunningRef.current = false
        abortControllerRef.current = null
      }
      setAiRunning(false)
    }
  }, [classId, currentWeekNum, getToken, weekMap, listFilterSubject])

  const handleSubjectClick = (item: WeekItem, weekNum: number) => {
    const key = `${weekNum}_${item.subject}`
    const result = aiResults[key]
    const weekId = dbWeeklyTopics.find(wt => wt.week === weekNum)?.week_id || todayWeekId
    if (result) setHitlItem({ item, result, weekId })
  }

  return (
    <div className="space-y-4 relative">
      {/* Global Trash Drop Zone OVERLAY */}
      {(draggingId || draggingGcItem) && (
        <div className="fixed inset-0 z-[60] pointer-events-none transition-opacity duration-300">
          <div
            className={`absolute bottom-12 right-12 w-32 h-32 rounded-3xl flex flex-col items-center justify-center border-[3px] transition-all pointer-events-auto shadow-2xl ${dragOverTrash
              ? 'bg-red-500/90 border-red-300 text-white scale-110 shadow-red-500/50 rotate-3'
              : 'bg-red-500/70 border-red-400/50 text-red-100 scale-100 backdrop-blur-md hover:bg-red-500/80 hover:scale-105'
              }`}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverTrash(true) }}
            onDragLeave={() => setDragOverTrash(false)}
            onDrop={e => {
              e.preventDefault(); e.stopPropagation();
              setDragOverTrash(false);
              setTrashConfirmInfo({ id: draggingId, gcItem: draggingGcItem })
            }}
          >
            <Trash2 size={dragOverTrash ? 44 : 32} className={`mb-2 transition-all ${dragOverTrash ? 'animate-bounce drop-shadow-md' : 'opacity-80'}`} />
            <span className="text-[10px] font-extrabold tracking-widest opacity-90 drop-shadow-sm uppercase">Drop to Delete</span>
          </div>
        </div>
      )}

      {/* Trash Confirm Modal */}
      {trashConfirmInfo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Block</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete this class block? This action can be undone if you haven't clicked Save Calendar yet.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setTrashConfirmInfo(null); setDraggingId(null); setDraggingGcItem(null) }}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (trashConfirmInfo.id) {
                    const block = lectureBlocks.find(b => b.id === trashConfirmInfo.id)
                    const gcMatch = block?.content?.match(/<!--GC_ITEM_ID:(.*?)-->/)
                    if (gcMatch) {
                      const gcId = gcMatch[1]
                      await fetch(`${BASE_URL}/api/teacher/classes/${classId}/course-items/${gcId}`, {
                        method: 'DELETE', headers: { Authorization: `Bearer ${await getToken()}` }
                      }).catch(() => { })
                    }
                    await deleteBlock(trashConfirmInfo.id)
                    setLectureBlocks(prev => prev.filter(b => b.id !== trashConfirmInfo.id))
                  }
                  if (trashConfirmInfo.gcItem) {
                    const gcId = trashConfirmInfo.gcItem.id
                    await fetch(`${BASE_URL}/api/teacher/classes/${classId}/course-items/${gcId}`, {
                      method: 'DELETE', headers: { Authorization: `Bearer ${await getToken()}` }
                    }).catch(() => { })

                    setGcData(prev => prev ? {
                      ...prev,
                      materials: (prev.materials || []).filter(m => m.id !== gcId),
                      assignments: (prev.assignments || []).filter(a => a.id !== gcId)
                    } : prev)
                  }
                  setTrashConfirmInfo(null)
                  setDraggingId(null)
                  setDraggingGcItem(null)
                  showToast('🗑️ Block permanently deleted!')
                }}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content — always visible ──────────────────────────────────── */}
      <>
        {/* ── Actions row ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => { setView('list'); setListWeek(null); setListFilterSubject(null) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${view === 'list' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}>
              <List size={13} /> List View
            </button>
            <button onClick={() => { setView('calendar'); setListFilterSubject(null) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${view === 'calendar' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}>
              <Calendar size={13} /> Calendar View
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Agent button */}
            <button
              onClick={runAiAgent}
              disabled={aiRunning || (weekMap[currentWeekNum] ?? []).length === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all
                  ${aiRunning
                  ? 'bg-violet-100 text-violet-500 border border-violet-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white'}`}
            >
              {aiRunning ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  AI running…
                </>
              ) : (
                <>
                  <Zap size={13} />
                  Run AI on this week
                </>
              )}
            </button>
            {/* LMS sync */}
            <button onClick={() => setShowLmsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-full border border-blue-200 transition-colors">
              <Wifi size={12} /> Sync LMS
            </button>
          </div>
        </div>

        {/* ── AI Legend (shown while running or after done) ─────────────────── */}
        {(aiRunning || Object.values(aiSubjectStatus).some(s => s !== 'idle')) && (
          <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50/80 border border-slate-100 rounded-2xl text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse inline-block" />
              AI processing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Done — click Review to open
            </span>
          </div>
        )}

        {/* ── Loading indicator ─────────────────────────────────────────────── */}
        {gcLoading && (
          <div className="flex items-center justify-center py-8 text-sm text-slate-400">
            <RefreshCw size={14} className="animate-spin mr-2" /> Loading curriculum…
          </div>
        )}

        {/* ── List View ─────────────────────────────────────────────────── */}
        {!gcLoading && view === 'list' && (() => {
          const displayWeek = listWeek ?? currentWeekNum
          const isCurrentWeek = displayWeek === currentWeekNum
          const weekId = dbWeeklyTopics.find(wt => wt.week === displayWeek)?.week_id ?? ''
          // Group by subject: each subject gets its material + assignment
          const weekTopics = weekMap[displayWeek] ?? []
          const weekMaterials = gcData?.materials?.filter(m => m.week_id === weekId) ?? []
          const weekAssignments = gcData?.assignments?.filter(a => a.week_id === weekId) ?? []

          const hasData = weekTopics.length > 0 || weekMaterials.length > 0

          const activeFilter = listFilterSubject || subject
          // Build per-subject map
          const subjects = [...new Set([
            ...weekTopics.map(t => t.subject),
            ...weekMaterials.map(m => m.subject || (activeFilter === 'All' ? 'Maths' : activeFilter)),
            ...weekAssignments.map(a => a.subject || (activeFilter === 'All' ? 'Maths' : activeFilter)),
          ])].filter(s => s && (activeFilter === 'All' || s === activeFilter))

          return (
            <div className="space-y-3">
              {/* Header row */}
              <div className="flex items-center gap-3">
                {!isCurrentWeek && (
                  <button onClick={() => setListWeek(null)}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-semibold">
                    <ChevronLeft size={13} /> Current week
                  </button>
                )}
                <div className="flex items-center gap-2">
                  {isCurrentWeek
                    ? <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500 text-white px-2 py-0.5 rounded-full">This Week</span>
                    : <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-400 text-white px-2 py-0.5 rounded-full">Week {displayWeek}</span>
                  }
                  <span className="font-semibold text-sm text-slate-800">{weekNameMap[displayWeek] ?? `Week ${displayWeek}`}</span>
                </div>
              </div>

              {!hasData ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  No curriculum data found. Try syncing your LMS.
                </div>
              ) : subjects.map(subj => {
                const activeFilter = listFilterSubject || subject
                const material = weekMaterials.find(m => (m.subject || (activeFilter === 'All' ? 'Maths' : activeFilter)) === subj) ?? null
                const assignment = weekAssignments.find(a => (a.subject || (activeFilter === 'All' ? 'Maths' : activeFilter)) === subj) ?? null
                const topicInfo = weekTopics.find(t => t.subject === subj)
                const subjectColor = SUBJECT_COLORS[subj] ?? 'bg-slate-100 text-slate-600 border-slate-200'

                const lessonKey = `lesson-${weekId}-${subj}`
                const hwKey = `hw-${weekId}-${subj}`
                const lessonExpanded = expandedListItems.has(lessonKey)
                const hwExpanded = expandedListItems.has(hwKey)

                const cleanMaterialTitle = material?.title
                  .replace(/^\[\d{4}-W\d{2}\]\s*/, '')
                  .replace(/^Week\s+\d+:\s*/, '')
                  .replace(/\s*—\s*(Lesson Plan|Homework)$/, '')
                  .trim() ?? topicInfo?.topic ?? ''

                const cleanHwTitle = assignment?.title
                  .replace(/^\[\d{4}-W\d{2}\]\s*/, '')
                  .replace(/^Week\s+\d+:\s*/, '')
                  .replace(/\s*—\s*(Lesson Plan|Homework)$/, '')
                  .trim() ?? ''

                return (
                  <div key={subj} className="backdrop-blur-xl bg-white/80 border border-white/60 rounded-2xl overflow-hidden shadow-sm">
                    {/* Subject header */}
                    <div className={`flex items-center gap-2 px-5 py-3 border-b border-slate-100`}>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${subjectColor}`}>{subj}</span>
                      <span className="text-xs text-slate-400">{cleanMaterialTitle}</span>

                      {/* AI Status / Review Button */}
                      <div className="ml-auto flex items-center gap-2">
                        {aiSubjectStatus[subj] === 'processing' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                            AI running…
                          </span>
                        )}
                        {aiSubjectStatus[subj] === 'done' && (
                          <button
                            onClick={() => handleSubjectClick({ subject: subj, topic: cleanMaterialTitle, learningGoal: topicInfo?.learningGoal ?? '', class_work: topicInfo?.class_work }, displayWeek)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors shadow-sm"
                          >
                            <CheckCircle size={10} /> Review
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lesson row */}
                    {(material || topicInfo) && (
                      <div className="border-b border-slate-100">
                        <button
                          onClick={() => toggleListItem(lessonKey)}
                          className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-indigo-50/40 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 shrink-0">📖 Lesson</span>
                            <span className="text-sm font-semibold text-slate-800 truncate">{cleanMaterialTitle}</span>
                          </div>
                          <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${lessonExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {!lessonExpanded && material?.description && (
                          <p className="px-5 pb-3 text-xs text-slate-400 leading-relaxed line-clamp-2 -mt-1">
                            {material.description.split('\n').filter(Boolean)[0]}
                          </p>
                        )}
                        {lessonExpanded && (
                          <div className="px-5 pb-4 space-y-3">
                            {topicInfo?.learningGoal && (
                              <div className="flex items-start gap-1.5">
                                <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-600 font-medium">{topicInfo.learningGoal}</p>
                              </div>
                            )}
                            {material?.description && (
                              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-xl p-3 max-h-80 overflow-y-auto">
                                {material.description}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Homework row */}
                    {assignment && (
                      <div>
                        <button
                          onClick={() => toggleListItem(hwKey)}
                          className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-amber-50/40 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 shrink-0">📝 Homework</span>
                            <span className="text-sm font-semibold text-slate-800 truncate">{cleanHwTitle}</span>
                            {assignment.due_date && (
                              <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                                Due {new Date(assignment.due_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {assignment.submission_summary && (
                              <span className="text-[10px] text-amber-600 font-semibold hidden sm:inline">
                                {assignment.submission_summary.turned_in}/{assignment.submission_summary.total} submitted
                              </span>
                            )}
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${hwExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {hwExpanded && (
                          <div className="px-5 pb-4 space-y-3">
                            {assignment.due_date && (
                              <p className="text-xs text-slate-400">
                                Due: {new Date(assignment.due_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            )}
                            {assignment.description && (
                              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed bg-amber-50/60 rounded-xl p-3 max-h-80 overflow-y-auto">
                                {assignment.description}
                              </pre>
                            )}
                            {assignment.submission_summary && (
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-amber-600 font-semibold">{assignment.submission_summary.turned_in}/{assignment.submission_summary.total} submitted</span>
                                {assignment.submission_summary.avg_grade !== null && (
                                  <span className="text-emerald-600 font-semibold">Avg {assignment.submission_summary.avg_grade}/{assignment.max_points}pts</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* ── Calendar View ─────────────────────────────────────────────────── */}
        {!gcLoading && view === 'calendar' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => { setCalendarWeek(w => Math.max(1, w - 1)); setExpandedCalDay(null) }}
                disabled={calendarWeek <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-30 transition-colors">
                <ChevronLeft size={13} /> Prev
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{weekNameMap[calendarWeek] ?? `Week ${calendarWeek}`}</span>
                {calendarWeek === currentWeekNum && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500 text-white px-2 py-0.5 rounded-full">This Week</span>
                )}
              </div>
              <button onClick={() => { setCalendarWeek(w => Math.min(totalWeeks, w + 1)); setExpandedCalDay(null) }}
                disabled={calendarWeek >= totalWeeks}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-30 transition-colors">
                Next <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex gap-1 px-1 overflow-x-auto">
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
                <button key={w} onClick={() => { setCalendarWeek(w); setExpandedCalDay(null) }}
                  className={`flex-1 min-w-[6px] h-1.5 rounded-full transition-colors ${w === calendarWeek ? 'bg-blue-500' : w === currentWeekNum ? 'bg-blue-200' : 'bg-slate-200 hover:bg-slate-300'
                    }`} title={weekNameMap[w] ?? `Week ${w}`} />
              ))}
            </div>

            {(() => {
              // Calendar shows GC materials (lessons) + teacher lecture blocks
              const weekMonday = weekStartDateMap[calendarWeek]
              const calWeekId = dbWeeklyTopics.find(wt => wt.week === calendarWeek)?.week_id
              const overriddenGcIds = new Set(lectureBlocks.map(b => b.content?.match(/<!--GC_ITEM_ID:(.*?)-->/)?.[1]).filter(Boolean))
              const calWeekMaterials = gcData?.materials?.filter(it => it.week_id === calWeekId && !overriddenGcIds.has(it.id)) ?? []
              const dayGcItems: Record<number, ClassroomItem[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] }
              for (const it of calWeekMaterials) { dayGcItems[0].push(it) }

              return (
                <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm">
                  {/* Calendar header with Save button */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="grid grid-cols-5 gap-2 flex-1 mr-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, dayIdx) => {
                        const hdrDate = weekMonday ? new Date(weekMonday) : null
                        if (hdrDate) hdrDate.setDate(hdrDate.getDate() + dayIdx)
                        return (
                          <div key={day} className="text-center text-[10px] font-bold text-slate-400 pb-1.5 border-b border-slate-100">
                            <div>{day.slice(0, 3).toUpperCase()}</div>
                            <div className="text-[9px] font-normal text-slate-300">{hdrDate ? `${hdrDate.getDate()}/${hdrDate.getMonth() + 1}` : ''}</div>
                          </div>
                        )
                      })}
                    </div>
                    <button
                      onClick={saveCalendar}
                      disabled={savingCalendar}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] font-bold shadow-sm transition-all"
                    >
                      <Save size={11} />
                      {savingCalendar ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, dayIdx) => {
                      const cellKey = `${calWeekId ?? calendarWeek}-${dayIdx}`
                      const isDragOver = dragOverCell === cellKey
                      const gcItems = dayGcItems[dayIdx] ?? []
                      const lblocks = calWeekId
                        ? lectureBlocks.filter(b => b.week_id === calWeekId && b.day_of_week === dayIdx).sort((a, b) => a.sort_order - b.sort_order)
                        : []
                      const hasContent = gcItems.length > 0 || lblocks.length > 0
                      return (
                        <div
                          key={day}
                          className={`flex flex-col gap-0.5 min-h-[72px] rounded-xl transition-all ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-400 ring-dashed p-1' : 'p-0.5'
                            }`}
                          onDragOver={e => { e.preventDefault(); setDragOverCell(cellKey); setDragOverBlockId(null); setDragOverIndex(null) }}
                          onDragLeave={() => setDragOverCell(null)}
                          onDrop={e => calWeekId ? handleDropOnCell(e, calWeekId, dayIdx, undefined, lblocks.length) : undefined}
                        >
                          {/* GC lesson items (originally non-draggable, now draggable) */}
                          {gcItems.map((it, gcIndex) => {
                            const cleanTitle = it.title
                              .replace(/^\[\d{4}-W\d{2}\]\s*/, '')
                              .replace(/^Week\s+\d+:\s*/, '')
                              .replace(/\s*—\s*(Lesson Plan|Homework)$/, '')
                              .trim()
                            return (
                              <Fragment key={it.id}>
                                <div
                                  className={`h-2 transition-all ${dragOverIndex?.day === cellKey && dragOverIndex?.index === -(gcIndex + 1) ? 'bg-blue-400 rounded' : 'bg-transparent'}`}
                                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIndex({ day: cellKey, index: -(gcIndex + 1) }); setDragOverCell(null); setDragOverBlockId(null) }}
                                  onDrop={e => { calWeekId && handleDropOnCell(e, calWeekId, dayIdx, undefined, 0) }}
                                />
                                <div
                                  draggable
                                  onDragStart={e => {
                                    setDraggingGcItem(it);
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  onDragEnd={() => { setDraggingGcItem(null); setDragOverCell(null); setDragOverBlockId(null); setDragOverIndex(null) }}
                                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverBlockId(it.id); setDragOverCell(null); setDragOverIndex(null) }}
                                  onDragLeave={() => setDragOverBlockId(null)}
                                  onDrop={e => { calWeekId && handleDropOnCell(e, calWeekId, dayIdx, it.id) }}
                                  onClick={() => {
                                    if (it.subject) setListFilterSubject(it.subject)
                                    setListWeek(calendarWeek)
                                    setView('list')
                                  }}
                                  className={`rounded-xl p-2 border text-left w-full cursor-grab active:cursor-grabbing transition-all select-none ${SUBJECT_COLORS[it.subject || subject] ?? 'bg-indigo-50 border-indigo-200 text-indigo-700'} my-0.5 ${dragOverBlockId === it.id ? 'ring-2 ring-red-500 scale-105 z-10 shadow-lg' :
                                    draggingGcItem?.id === it.id ? 'opacity-40 scale-95' : 'hover:shadow-sm hover:scale-[1.02]'}`}
                                >
                                  <p className="text-[9px] font-bold leading-tight opacity-60 uppercase">📖 {it.subject || subject}</p>
                                  <p className="text-[9px] leading-tight mt-0.5 font-medium line-clamp-2">{cleanTitle}</p>
                                </div>
                              </Fragment>
                            )
                          })}

                          {/* Teacher lecture blocks (draggable) */}
                          {lblocks.map((lb, index) => {
                            const isGcOverride = lb.content?.includes('<!--GC_ITEM_ID:')
                            const color = isGcOverride ? (SUBJECT_COLORS[lb.subject || subject] ?? 'bg-indigo-50 border-indigo-200 text-indigo-700') : (SUBJECT_COLORS[lb.subject] ?? 'bg-slate-50 border-slate-200 text-slate-700')
                            return (
                              <Fragment key={lb.id}>
                                {/* Insert Zone Above Block */}
                                <div
                                  className={`h-2 transition-all ${dragOverIndex?.day === cellKey && dragOverIndex?.index === index ? 'bg-blue-400 rounded' : 'bg-transparent'}`}
                                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIndex({ day: cellKey, index }); setDragOverCell(null); setDragOverBlockId(null) }}
                                  onDrop={e => { calWeekId && handleDropOnCell(e, calWeekId, dayIdx, undefined, index) }}
                                />
                                {/* The Block */}
                                <div
                                  draggable
                                  onDragStart={e => handleDragStart(e, lb.id)}
                                  onDragEnd={() => { setDraggingId(null); setDragOverCell(null); setDragOverBlockId(null); setDragOverIndex(null) }}
                                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverBlockId(lb.id); setDragOverCell(null); setDragOverIndex(null) }}
                                  onDragLeave={() => setDragOverBlockId(null)}
                                  onDrop={e => { calWeekId && handleDropOnCell(e, calWeekId, dayIdx, lb.id) }}
                                  onClick={() => {
                                    if (lb.subject) setListFilterSubject(lb.subject)
                                    if (isGcOverride) {
                                      setListWeek(calendarWeek)
                                      setView('list')
                                    } else {
                                      handleEditBlock(lb)
                                    }
                                  }}
                                  className={`rounded-xl p-2 border text-left w-full cursor-grab active:cursor-grabbing transition-all select-none ${color} ${dragOverBlockId === lb.id ? 'ring-2 ring-red-500 scale-105 z-10 shadow-lg' :
                                    draggingId === lb.id ? 'opacity-40 scale-95' : 'hover:shadow-sm'
                                    }`}
                                >
                                  <p className="text-[9px] font-bold leading-tight opacity-60 uppercase">{isGcOverride ? `📖 ${lb.subject || subject}` : `✏️ ${lb.subject}`}</p>
                                  <p className="text-[9px] leading-tight mt-0.5 font-medium line-clamp-2">{lb.title}</p>
                                </div>
                              </Fragment>
                            )
                          })}

                          {/* Empty drop zone hint / Bottom Insert Zone */}
                          <div
                            className={`min-h-[40px] mt-1 flex-1 flex items-center justify-center rounded transition-all border border-transparent ${isDragOver || (dragOverIndex?.day === cellKey && dragOverIndex?.index === lblocks.length)
                              ? 'border-dashed border-blue-400 bg-blue-50/50'
                              : !hasContent ? 'border-dashed border-slate-200' : ''
                              }`}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIndex({ day: cellKey, index: lblocks.length }); setDragOverCell(null); setDragOverBlockId(null) }}
                            onDrop={e => { calWeekId && handleDropOnCell(e, calWeekId, dayIdx, undefined, lblocks.length) }}
                          >
                            <span className="text-[9px] text-slate-300">
                              {(isDragOver || (dragOverIndex?.day === cellKey && dragOverIndex?.index === lblocks.length)) ? 'Drop here' : (!hasContent ? '—' : '')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <p className="text-[10px] text-slate-300 mt-3 text-center">
                    {weekNameMap[calendarWeek] ?? `Week ${calendarWeek}`} of {totalWeeks} · Drag blocks to schedule · GC items shown in indigo
                  </p>
                </div>
              )
            })()}

            {/* ── Add Lecture Editor ───────────────────────────────────────── */}
            <div className="mt-4">
              {/* Section header / toggle */}
              <button
                onClick={() => { setShowAddLecture(v => !v); setEditingBlock(null) }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus size={14} />
                {showAddLecture ? 'Close Editor' : 'Add Lecture / Homework'}
              </button>

              {showAddLecture && (
                <div className={`mt-4 space-y-5 backdrop-blur-xl bg-white/90 border border-white/60 rounded-3xl p-6 shadow-xl ${isFullscreen ? 'fixed inset-0 z-[9999] bg-slate-50 p-10 overflow-y-auto rounded-none' : ''}`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <h2 className="text-base font-black text-slate-800 tracking-tight mb-1.5">
                        {editingBlock ? '✏️ Edit Block' : 'Add Lecture'}
                      </h2>
                      <input
                        type="text"
                        value={editorTitle}
                        onChange={e => setEditorTitle(e.target.value)}
                        placeholder="Block title (e.g. Fractions – Day 1)…"
                        className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-blue-400 text-slate-700 placeholder:text-slate-300"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Subject Picker */}
                      <div className="relative">
                        <button
                          onClick={() => { setShowSubjectPicker(!showSubjectPicker); setShowDatePicker(false) }}
                          className="flex items-center gap-2 px-4 py-2 bg-white border-[1.5px] border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:border-blue-500 transition-all shadow-sm"
                        >
                          <BookOpen size={13} className="text-blue-500" />
                          <span>{editorSubject}</span>
                          <ChevronDown size={12} className="text-slate-400" />
                        </button>
                        {showSubjectPicker && (
                          <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-2">
                            <div className="max-h-[200px] overflow-y-auto">
                              {editorSubjectList.map(s => (
                                <button
                                  key={s}
                                  onClick={() => { setEditorSubject(s); setShowSubjectPicker(false) }}
                                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors ${editorSubject === s ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                            <div className="h-px bg-slate-100 my-1.5" />
                            {isCreatingSubject ? (
                              <div className="px-2 pb-1.5">
                                <input
                                  autoFocus
                                  value={newSubjectValue}
                                  onChange={e => setNewSubjectValue(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                                  placeholder="Type subject..."
                                  className="w-full text-xs font-bold border border-blue-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 ring-blue-400"
                                />
                                <div className="flex justify-end gap-2 mt-1.5">
                                  <button onClick={() => setIsCreatingSubject(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                                  <button onClick={handleAddSubject} className="text-[10px] font-bold text-blue-600 hover:text-blue-700">Add</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setIsCreatingSubject(true)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-black text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                              >
                                <Plus size={12} /> Add More
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date Picker */}
                      <div className="relative">
                        <button
                          onClick={() => { setShowDatePicker(!showDatePicker); setShowSubjectPicker(false) }}
                          className="flex items-center gap-2 px-4 py-2 bg-white border-[1.5px] border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:border-blue-500 transition-all shadow-sm"
                        >
                          <Calendar size={13} className="text-blue-500" />
                          <span>{formatEditorDate(editorDate)}</span>
                          <ChevronDown size={12} className="text-slate-400" />
                        </button>
                        {showDatePicker && (
                          <div className="absolute top-full right-0 mt-2 w-[260px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-3">
                            <div className="flex items-center justify-between mb-3 px-1">
                              <span className="font-black text-slate-800 text-xs">
                                {editorCalMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditorCalMonth(new Date(editorCalMonth.getFullYear(), editorCalMonth.getMonth() - 1, 1))}
                                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400"
                                >
                                  <ChevronLeft size={14} />
                                </button>
                                <button
                                  onClick={() => setEditorCalMonth(new Date(editorCalMonth.getFullYear(), editorCalMonth.getMonth() + 1, 1))}
                                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400"
                                >
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <span key={i} className="text-[9px] font-bold text-slate-300 uppercase">{d}</span>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5">
                              {(() => {
                                const daysInMonth = new Date(editorCalMonth.getFullYear(), editorCalMonth.getMonth() + 1, 0).getDate()
                                const firstDay = new Date(editorCalMonth.getFullYear(), editorCalMonth.getMonth(), 1).getDay()
                                const today = new Date()
                                const cells = []
                                for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />)
                                for (let d = 1; d <= daysInMonth; d++) {
                                  const isToday = today.getDate() === d && today.getMonth() === editorCalMonth.getMonth() && today.getFullYear() === editorCalMonth.getFullYear()
                                  const isSelected = editorDate.getDate() === d && editorDate.getMonth() === editorCalMonth.getMonth() && editorDate.getFullYear() === editorCalMonth.getFullYear()
                                  cells.push(
                                    <button
                                      key={d}
                                      onClick={() => { setEditorDate(new Date(editorCalMonth.getFullYear(), editorCalMonth.getMonth(), d)); setShowDatePicker(false) }}
                                      className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-all relative
                                          ${isSelected ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                      {d}
                                      {isToday && !isSelected && <div className="absolute inset-0 border border-red-400 rounded-full m-0.5" />}
                                    </button>
                                  )
                                }
                                return cells
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Editor Interface */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
                    {/* Menu Bar */}
                    <div className="flex items-center gap-4 px-4 py-1.5 bg-white text-xs font-medium text-slate-700 border-b border-slate-100">
                      {/* Edit menu */}
                      <div className="relative">
                        <button
                          onClick={() => setEditorActiveMenu(editorActiveMenu === 'edit' ? null : 'edit')}
                          className={`hover:bg-slate-100 px-2 py-0.5 rounded transition-colors ${editorActiveMenu === 'edit' ? 'bg-slate-100' : ''}`}
                        >
                          Edit
                        </button>
                        {editorActiveMenu === 'edit' && (
                          <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                            {[
                              { label: 'Undo', cmd: 'undo', icon: '⤺', shortcut: 'Ctrl+Z' },
                              { label: 'Redo', cmd: 'redo', icon: '⤻', shortcut: 'Ctrl+Y' },
                              { label: 'divider' },
                              { label: 'Cut', cmd: 'cut', icon: '✂', shortcut: 'Ctrl+X' },
                              { label: 'Copy', cmd: 'copy', icon: '❐', shortcut: 'Ctrl+C' },
                              { label: 'Select all', cmd: 'selectAll', icon: '⠿', shortcut: 'Ctrl+A' },
                            ].map((item, i) => item.label === 'divider' ? (
                              <div key={i} className="h-px bg-slate-100 my-1" />
                            ) : (
                              <button
                                key={item.label}
                                onClick={() => { applyFormat(item.cmd!); setEditorActiveMenu(null) }}
                                className="w-full flex items-center justify-between px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="opacity-70">{item.icon}</span>
                                  <span>{item.label}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono">{item.shortcut}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Insert menu */}
                      <div className="relative">
                        <button
                          onClick={() => setEditorActiveMenu(editorActiveMenu === 'insert' ? null : 'insert')}
                          className={`hover:bg-slate-100 px-2 py-0.5 rounded transition-colors ${editorActiveMenu === 'insert' ? 'bg-slate-100' : ''}`}
                        >
                          Insert
                        </button>
                        {editorActiveMenu === 'insert' && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                            {[
                              { label: 'Link', icon: '🔗', cmd: 'createLink' },
                              { label: 'Image', icon: '🖼', cmd: 'insertImage' },
                              { label: 'divider' },
                              { label: 'Horizontal line', icon: '—', cmd: 'insertHorizontalRule' },
                            ].map((item, i) => item.label === 'divider' ? (
                              <div key={i} className="h-px bg-slate-100 my-1" />
                            ) : (
                              <button
                                key={item.label}
                                onClick={() => {
                                  if (item.cmd === 'createLink') { const url = prompt('Enter URL:'); if (url) applyFormat(item.cmd, url) }
                                  else if (item.cmd === 'insertImage') { const url = prompt('Enter Image URL:'); if (url) applyFormat(item.cmd, url) }
                                  else if (item.cmd) applyFormat(item.cmd)
                                  setEditorActiveMenu(null)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                <span className="opacity-70">{item.icon}</span>
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* View menu */}
                      <div className="relative">
                        <button
                          onClick={() => setEditorActiveMenu(editorActiveMenu === 'view' ? null : 'view')}
                          className={`hover:bg-slate-100 px-2 py-0.5 rounded transition-colors ${editorActiveMenu === 'view' ? 'bg-slate-100' : ''}`}
                        >
                          View
                        </button>
                        {editorActiveMenu === 'view' && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                            <button onClick={() => { setIsFullscreen(true); setEditorActiveMenu(null) }} className="w-full flex items-center gap-2 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">
                              <span>⤢</span> Full-screen
                            </button>
                            <button onClick={() => { setIsFullscreen(false); setEditorActiveMenu(null) }} className="w-full flex items-center gap-2 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">
                              <span>⤡</span> Exit Fullscreen
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button onClick={() => { toggleSourceMode(); setEditorActiveMenu(null) }} className="w-full flex items-center gap-2 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">
                              <span className="font-mono text-[10px]">&lt;/&gt;</span> HTML Editor
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Format menu */}
                      <div className="relative">
                        <button
                          onClick={() => setEditorActiveMenu(editorActiveMenu === 'format' ? null : 'format')}
                          className={`hover:bg-slate-100 px-2 py-0.5 rounded transition-colors ${editorActiveMenu === 'format' ? 'bg-slate-100' : ''}`}
                        >
                          Format
                        </button>
                        {editorActiveMenu === 'format' && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                            {[
                              { label: 'Bold', cmd: 'bold', icon: 'B', shortcut: 'Ctrl+B', iconClass: 'font-bold' },
                              { label: 'Italic', cmd: 'italic', icon: 'I', shortcut: 'Ctrl+I', iconClass: 'italic' },
                              { label: 'Underline', cmd: 'underline', icon: 'U', shortcut: 'Ctrl+U', iconClass: 'underline' },
                              { label: 'Strikethrough', cmd: 'strikeThrough', icon: 'S̶', shortcut: '' },
                            ].map(sub => (
                              <button
                                key={sub.label}
                                onClick={() => { applyFormat(sub.cmd); setEditorActiveMenu(null) }}
                                className="w-full flex items-center justify-between px-3 py-1 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-4 text-center ${sub.iconClass || ''}`}>{sub.icon}</span>
                                  <span>{sub.label}</span>
                                </div>
                                {sub.shortcut && <span className="text-[9px] opacity-60 font-mono">{sub.shortcut}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 px-4 py-2 border-b border-slate-100 bg-white">
                      {/* Font size */}
                      <div className="relative">
                        <button
                          onClick={() => setEditorActiveMenu(editorActiveMenu === 'font-size' ? null : 'font-size')}
                          className="flex items-center gap-1 hover:bg-slate-50 px-2 py-1 rounded"
                        >
                          <span className="text-xs text-slate-700">{fontSize}</span>
                          <ChevronDown size={11} className="text-slate-400" />
                        </button>
                        {editorActiveMenu === 'font-size' && (
                          <div className="absolute top-full left-0 mt-1 w-20 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                            {[{ label: '8pt', val: '1' }, { label: '10pt', val: '2' }, { label: '12pt', val: '3' }, { label: '14pt', val: '4' }, { label: '18pt', val: '5' }, { label: '24pt', val: '6' }, { label: '36pt', val: '7' }].map(s => (
                              <button key={s.label} onClick={() => { applyFormat('fontSize', s.val); setFontSize(s.label); setEditorActiveMenu(null) }} className="w-full text-left px-3 py-1 text-xs hover:bg-slate-50 text-slate-600">{s.label}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="w-px h-4 bg-slate-200" />

                      {/* B I U */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => applyFormat('bold')} className="text-xs font-bold text-slate-800 hover:bg-slate-100 w-7 h-7 rounded flex items-center justify-center">B</button>
                        <button onClick={() => applyFormat('italic')} className="text-xs italic text-slate-800 hover:bg-slate-100 w-7 h-7 rounded flex items-center justify-center font-serif">I</button>
                        <button onClick={() => applyFormat('underline')} className="text-xs underline text-slate-800 hover:bg-slate-100 w-7 h-7 rounded flex items-center justify-center">U</button>
                      </div>

                      <div className="w-px h-4 bg-slate-200" />

                      {/* Font color */}
                      <div className="relative">
                        <button
                          onClick={() => setEditorActiveMenu(editorActiveMenu === 'font-color' ? null : 'font-color')}
                          className="flex flex-col items-center hover:bg-slate-50 rounded px-1"
                        >
                          <span className="text-xs font-bold text-slate-800">A</span>
                          <div className="w-4 h-0.5" style={{ backgroundColor: selectedColor }} />
                        </button>
                        {editorActiveMenu === 'font-color' && (
                          <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 grid grid-cols-4 gap-1.5">
                            {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'].map(c => (
                              <button key={c} onClick={() => { applyFormat('foreColor', c); setSelectedColor(c); setEditorActiveMenu(null) }} style={{ backgroundColor: c }} className="w-5 h-5 rounded border border-slate-100 hover:scale-110 transition-all" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Highlight color */}
                      <div className="relative">
                        <button
                          onClick={() => setEditorActiveMenu(editorActiveMenu === 'font-highlight' ? null : 'font-highlight')}
                          className="flex flex-col items-center hover:bg-slate-50 rounded px-1"
                        >
                          <Pencil size={11} className="text-slate-800" />
                          <div className="w-4 h-0.5" style={{ backgroundColor: selectedHighlight }} />
                        </button>
                        {editorActiveMenu === 'font-highlight' && (
                          <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 grid grid-cols-4 gap-1.5">
                            {['#FCF8E3', '#FEF3C7', '#DCFCE7', '#DBEAFE', '#F3E8FF', '#FFE4E6', '#F1F5F9', '#FFFFFF'].map(c => (
                              <button key={c} onClick={() => { applyFormat('hiliteColor', c); setSelectedHighlight(c); setEditorActiveMenu(null) }} style={{ backgroundColor: c }} className="w-5 h-5 rounded border border-slate-100 hover:scale-110 transition-all" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Editable Area */}
                    <div className="relative overflow-hidden bg-white" style={{ zoom: zoomLevel }}>
                      {isSourceMode ? (
                        <textarea
                          value={sourceHtml}
                          onChange={e => setSourceHtml(e.target.value)}
                          className="w-full min-h-[240px] p-5 font-mono text-xs bg-slate-50 text-slate-700 focus:outline-none resize-none border-0"
                          placeholder="Type raw HTML here..."
                        />
                      ) : (
                        <div
                          ref={editorRef}
                          onInput={handleEditorInput}
                          className="min-h-[240px] p-5 text-sm text-slate-800 outline-none focus:ring-0 selection:bg-blue-100 leading-relaxed"
                          contentEditable
                          spellCheck={false}
                          suppressContentEditableWarning
                        />
                      )}
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-4 py-1.5 bg-white text-[11px] text-slate-500 border-t border-slate-100">
                      <span>{wordCount} words</span>
                      <div className="flex items-center gap-3">
                        <span onClick={toggleSourceMode} className={`font-mono cursor-pointer transition-colors ${isSourceMode ? 'text-blue-600 font-bold' : 'opacity-60 hover:opacity-100'}`}>&lt;/&gt;</span>
                        <span onClick={() => handleZoom(0.1)} className="cursor-pointer opacity-60 hover:opacity-100 text-base leading-none">+</span>
                        <span onClick={() => handleZoom(-0.1)} className="cursor-pointer opacity-60 hover:opacity-100 text-base leading-none">−</span>
                        <span onClick={() => setIsFullscreen(!isFullscreen)} className="cursor-pointer opacity-60 hover:opacity-100">⤢</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Homework Editor ────────────────────────── */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col mt-4">
                    <div className="px-4 py-2 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700">📋 Homework & Assignments</span>
                    </div>
                    <div className="relative overflow-hidden bg-white" style={{ zoom: zoomLevel }}>
                      <div
                        ref={homeworkEditorRef}
                        onInput={() => {
                          const text = homeworkEditorRef.current?.innerText || ''
                          const count = text.trim() ? text.trim().split(/\s+/).length : 0
                          setHomeworkWordCount(count)
                        }}
                        className="min-h-[100px] p-5 text-sm text-slate-800 outline-none focus:ring-0 selection:bg-amber-100 leading-relaxed empty:before:content-['Enter_homework_instructions_here...'] empty:before:text-slate-300 pointer-events-auto"
                        contentEditable
                        spellCheck={false}
                        suppressContentEditableWarning
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-1.5 bg-white text-[11px] text-slate-500 border-t border-slate-100">
                      <span>{homeworkWordCount} words</span>
                    </div>
                  </div>

                  {/* Attached files */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-xs text-slate-400">📄</span>
                          <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">{file.name}</span>
                          <span className="text-[9px] text-slate-400">({file.size})</span>
                          <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setShowAttachModal(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700"
                    >
                      <Paperclip size={14} className="text-slate-500" />
                      Attach
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowAddLecture(false); setEditingBlock(null) }}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitLecture}
                        disabled={submittingLecture}
                        className="px-7 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        {submittingLecture ? (editingBlock ? 'Saving…' : 'Adding…') : (editingBlock ? 'Save Changes' : 'Add to Queue')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Queue: unscheduled lecture blocks ────────────────────────── */}
            {lectureBlocks.filter(b => b.week_id === null).length > 0 && (
              <div className="mt-4 backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-700">📦 Queue — Unscheduled Blocks</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Drag a block onto a calendar day to schedule it</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {lectureBlocks.filter(b => b.week_id === null).length} block{lectureBlocks.filter(b => b.week_id === null).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lectureBlocks.filter(b => b.week_id === null).map(lb => {
                    const qSubjectColor: Record<string, string> = {
                      Maths: 'bg-blue-50 border-blue-200 text-blue-700',
                      Science: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                      English: 'bg-violet-50 border-violet-200 text-violet-700',
                      HSIE: 'bg-amber-50 border-amber-200 text-amber-700',
                      'Creative Arts': 'bg-pink-50 border-pink-200 text-pink-700',
                      PE: 'bg-orange-50 border-orange-200 text-orange-700',
                    }
                    const qColor = qSubjectColor[lb.subject] ?? 'bg-slate-50 border-slate-200 text-slate-700'
                    return (
                      <div
                        key={lb.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lb.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border select-none transition-all hover:shadow-md ${qColor} ${draggingId === lb.id ? 'opacity-40 scale-95 cursor-grabbing' : 'cursor-grab'}`}
                      >
                        <span className="text-sm opacity-40 shrink-0">⠿</span>
                        {/* Click body (not drag handle) to open editor */}
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); handleEditBlock(lb) }}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-xs font-bold leading-tight truncate">{lb.title}</p>
                          <p className="text-[9px] opacity-60">{lb.subject} · click to edit</p>
                        </button>
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={async e => {
                            e.stopPropagation()
                            await deleteBlock(lb.id)
                            setLectureBlocks(prev => prev.filter(b => b.id !== lb.id))
                          }}
                          className="shrink-0 text-current opacity-30 hover:opacity-80 transition-opacity"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div
                  className={`mt-3 rounded-xl border-2 border-dashed p-2 text-center transition-colors ${dragOverCell === 'queue' ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}
                  onDragOver={e => { e.preventDefault(); setDragOverCell('queue') }}
                  onDragLeave={() => setDragOverCell(null)}
                  onDrop={e => {
                    e.preventDefault(); setDragOverCell(null)
                    if (draggingId) {
                      setLectureBlocks(prev => prev.map(b => b.id === draggingId ? { ...b, week_id: null, day_of_week: null, sort_order: 0 } : b))
                      setDraggingId(null)
                    }
                  }}
                >
                  <span className="text-[10px] text-slate-300">↩ Drop here to return block to queue</span>
                </div>
              </div>
            )}

            {/* Drop-to-queue zone when dragging a scheduled block (queue empty) */}
            {draggingId && lectureBlocks.filter(b => b.week_id === null).length === 0 && (
              <div
                className={`mt-4 rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${dragOverCell === 'queue' ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}
                onDragOver={e => { e.preventDefault(); setDragOverCell('queue') }}
                onDragLeave={() => setDragOverCell(null)}
                onDrop={e => {
                  e.preventDefault(); setDragOverCell(null)
                  if (draggingId) {
                    setLectureBlocks(prev => prev.map(b => b.id === draggingId ? { ...b, week_id: null, day_of_week: null, sort_order: 0 } : b))
                    setDraggingId(null)
                  }
                }}
              >
                <span className="text-[10px] text-slate-400">↩ Drop here to unschedule block</span>
              </div>
            )}

          </div>
        )}
      </>

      {/* ── Conflict Modal ──────────────────────────────────────────────────── */}
      {conflictInfo && (() => {
        const dragged = lectureBlocks.find(b => b.id === conflictInfo.draggedId)
        const target = lectureBlocks.find(b => b.id === conflictInfo.targetId)
        return (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConflictInfo(null)} />
            <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <h3 className="text-sm font-black text-slate-800 mb-1">Slot already occupied</h3>
              <p className="text-xs text-slate-500 mb-4">
                <span className="font-bold text-slate-700">&ldquo;{target?.title}&rdquo;</span> is already here. Choose how to proceed:
              </p>
              <div className="space-y-2">
                <button onClick={() => resolveConflict('replace')}
                  className="w-full text-left px-4 py-3 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors">
                  <p className="text-xs font-black text-red-700">🔄 Replace</p>
                  <p className="text-[10px] text-red-500 mt-0.5">Delete existing block from DB — schedule this one in its place</p>
                </button>
                <button onClick={() => resolveConflict('stack')}
                  className="w-full text-left px-4 py-3 rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <p className="text-xs font-black text-blue-700">📚 Stack</p>
                  <p className="text-[10px] text-blue-500 mt-0.5">Keep both blocks in the same slot — new block goes on top</p>
                </button>
                <button onClick={() => setConflictInfo(null)}
                  className="w-full text-left px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <p className="text-xs font-black text-slate-500">✕ Cancel</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Do nothing — keep both blocks where they are</p>
                </button>
              </div>
              <button onClick={() => setConflictInfo(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Hidden file input for attachment */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

      {/* Attachment Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAttachModal(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-lg p-1 shadow-2xl overflow-hidden border border-white/20">
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-[1.4rem] m-2 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative w-12 h-16">
                <div className="absolute inset-0 border-2 border-slate-400 rounded-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-white border-l-2 border-b-2 border-slate-400" />
                <div className="absolute inset-x-2 top-6 space-y-1">
                  {[1, 2, 3].map(i => <div key={i} className="h-[1px] bg-slate-300 w-full" />)}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-700">Drop document here to upload</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
              >
                Select from device
              </button>
            </div>
            <button
              onClick={() => setShowAttachModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showUploadModal && (
        <UploadModal classId={classId} onClose={() => setShowUploadModal(false)} onSaved={() => showToast('✅ Curriculum entry saved!')} />
      )}
      {showLmsModal && (
        <LmsModal
          classId={classId}
          onClose={() => setShowLmsModal(false)}
          onConnected={() => { handleLmsConnected(); setShowLmsModal(false) }}
        />
      )}
      {hitlItem && (
        <HitlPopup
          item={hitlItem.item}
          result={hitlItem.result}
          gcData={gcData}
          classId={classId}
          weekId={hitlItem.weekId}
          onClose={() => setHitlItem(null)}
          onResultUpdate={updated => setAiResults(prev => {
            const next = { ...prev, [`${hitlItem.weekId.split('-W')[1] ? parseInt(hitlItem.weekId.split('-W')[1]) : currentWeekNum}_${hitlItem.item.subject}`]: updated }
            cacheSet(`aiResults:${classId}`, next)
            return next
          })}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  )
}
