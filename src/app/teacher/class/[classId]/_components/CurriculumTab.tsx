'use client'
import { useState, useEffect } from 'react'
import {
  ChevronDown, ChevronLeft, ChevronRight, Pencil, Calendar, List,
  CheckCircle, X, Save, Sparkles, Wifi, RefreshCw, BookOpen,
  ClipboardList, Users, Zap, Send, MessageSquare,
} from 'lucide-react'
import { SUBJECTS } from '@/lib/mockTeacherData'
import type { ClassroomCourseData, ClassroomItem, ClassroomWeeklyTopic } from '@/lib/api'

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

interface WeekItem { subject: string; topic: string; learningGoal: string }
interface SavedEntry { topic: string; learningGoal: string }
interface AIResult {
  summary: string
  deepDive: string
  tiktoks: { title: string; creator: string; views: string }[]
  suggestions: string[]
  bondingLocations: { name: string; description: string }[]
}
type AIStatus = 'idle' | 'processing' | 'done'

interface Props { classId: string; subject: string }

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
    suggestions: suggestions[s] ?? suggestions.Maths,
    bondingLocations: bonding[s] ?? bonding.Maths,
  }
}

// ── HITL Popup ───────────────────────────────────────────────────────────────

interface HitlProps {
  item: WeekItem
  result: AIResult
  gcData: ClassroomCourseData | null
  onClose: () => void
  onResultUpdate: (updated: AIResult) => void
}

function HitlPopup({ item, result, gcData, onClose, onResultUpdate }: HitlProps) {
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState<Record<string, string>>({})
  const [regenLoading, setRegenLoading] = useState<string | null>(null)
  const [localResult, setLocalResult] = useState<AIResult>(result)

  const relatedMaterials = gcData?.materials.filter(m =>
    m.title.toLowerCase().includes(item.subject.toLowerCase()) ||
    m.description?.toLowerCase().includes(item.topic.toLowerCase())
  ) ?? []
  const relatedAssignments = gcData?.assignments.filter(a =>
    a.title.toLowerCase().includes(item.subject.toLowerCase())
  ) ?? []

  const regen = (section: string, prompt: string) => {
    setRegenLoading(section)
    setActiveChat(null)
    const fresh = generateAIResult(item.subject, item.topic)
    // Simulate streaming by replacing after delay
    setTimeout(() => {
      setLocalResult(prev => {
        const next = { ...prev }
        if (section === 'summary') next.summary = fresh.summary
        if (section === 'deepDive') next.deepDive = fresh.deepDive
        if (section === 'tiktoks') next.tiktoks = fresh.tiktoks
        if (section === 'suggestions') next.suggestions = fresh.suggestions
        if (section === 'bonding') next.bondingLocations = fresh.bondingLocations
        return next
      })
      setRegenLoading(null)
      onResultUpdate(localResult)
    }, 2200)
  }

  const SectionCard = ({
    id, title, icon, children,
  }: { id: string; title: string; icon: string; children: React.ReactNode }) => {
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">📋 Lesson Plan & Homework</p>

            {/* Learning goal */}
            <div className="rounded-2xl bg-blue-50/80 border border-blue-100 p-4">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1.5">Learning Goal</p>
              <p className="text-xs text-slate-700 leading-relaxed">{item.learningGoal}</p>
            </div>

            {/* Materials */}
            {relatedMaterials.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <BookOpen size={10} /> Lesson Materials
                </p>
                {relatedMaterials.map(m => (
                  <div key={m.id} className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                    <p className="text-xs font-semibold text-slate-800">{m.title}</p>
                    {m.description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{m.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <BookOpen size={10} /> Lesson Plan
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Topic:</strong> {item.topic}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hands-on investigation with guided practice. Students work in pairs to explore key concepts, then share findings with the class. Formative assessment through observation and exit tickets.
                </p>
              </div>
            )}

            {/* Assignments */}
            {relatedAssignments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <ClipboardList size={10} /> Homework / Assignments
                </p>
                {relatedAssignments.map(a => (
                  <div key={a.id} className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5">
                    <p className="text-xs font-semibold text-slate-800">{a.title}</p>
                    {a.due_date && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Due: {new Date(a.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        {a.max_points && ` · ${a.max_points} pts`}
                      </p>
                    )}
                    {a.submission_summary && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Users size={9} /> {a.submission_summary.turned_in}/{a.submission_summary.total} submitted
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50/60 border border-amber-100 p-4">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide flex items-center gap-1 mb-2">
                  <ClipboardList size={10} /> Homework
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Complete 5 practice problems from the worksheet. Read pages 24–26 and answer comprehension questions. Due next lesson.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — AI results */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              🤖 AI Analysis — click any section to regenerate
            </p>

            {/* Summary */}
            <SectionCard id="summary" title="Summary for Parents" icon="📝">
              <p className="text-xs text-slate-600 leading-relaxed">{localResult.summary}</p>
            </SectionCard>

            {/* Deep Dive */}
            <SectionCard id="deepDive" title="Deep Dive" icon="🔍">
              <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line space-y-1">
                {localResult.deepDive.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('**') ? 'font-semibold text-slate-800' : ''}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            </SectionCard>

            {/* TikTok Videos */}
            <SectionCard id="tiktoks" title="TikTok Videos Found" icon="🎬">
              <div className="space-y-2">
                {localResult.tiktoks.map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-slate-50 rounded-xl px-3 py-2">
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
            </SectionCard>

            {/* At-Home Suggestions */}
            <SectionCard id="suggestions" title="At-Home Activity Suggestions" icon="🏠">
              <ul className="space-y-1.5">
                {localResult.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 leading-snug">{s}</li>
                ))}
              </ul>
            </SectionCard>

            {/* Bonding Locations */}
            <SectionCard id="bonding" title="Family Bonding Locations" icon="📍">
              <div className="space-y-2">
                {localResult.bondingLocations.map((b, i) => (
                  <div key={i} className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2">
                    <p className="text-xs font-semibold text-emerald-800">{b.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{b.description}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
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
  onSubjectClick?: (item: WeekItem) => void
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
      {items.map(({ subject: subj, topic, learningGoal }) => {
        const isEditing = editSubj === subj
        const justSaved = savedSubj === subj
        const status: AIStatus = aiStatus?.[`${week}_${subj}`] ?? 'idle'
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
                            onClick={() => onSubjectClick?.({ subject: subj, topic, learningGoal })}
                            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle size={10} /> Review
                          </button>
                        )}
                        <button onClick={() => startEdit({ subject: subj, topic, learningGoal })}
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

const LMS_PROVIDERS = ['Canvas', 'Google Classroom', 'Compass', 'Schoology', 'Microsoft Teams', 'Other']
const LMS_STEPS = ['Connecting to LMS…', 'Syncing curriculum data…', 'Finalising import…']

function LmsModal({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [provider, setProvider] = useState('')
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0)

  const handleConnect = () => {
    if (!provider || !url.trim() || !key.trim()) return
    setStep(1)
    setTimeout(() => setStep(2), 1400)
    setTimeout(() => setStep(3), 2800)
    setTimeout(() => { setStep(4); onConnected() }, 4200)
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
            <p className="text-xs text-slate-500">Curriculum data has been synced. Your timetable and topics are now up to date.</p>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">School LMS URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="e.g. school.instructure.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">API Key / Access Token</label>
              <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste your API key here"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleConnect} disabled={!provider || !url.trim() || !key.trim()}
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
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      s.state === 'RETURNED' ? 'bg-emerald-100 text-emerald-700' :
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

export default function CurriculumTab({ classId, subject }: Props) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([CURRENT_WEEK]))
  const [toast, setToast] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showLmsModal, setShowLmsModal] = useState(false)
  const [lmsConnected, setLmsConnected] = useState(false)
  const [calendarWeek, setCalendarWeek] = useState(CURRENT_WEEK)
  const [expandedCalDay, setExpandedCalDay] = useState<string | null>(null)
  const [savedOverrides, setSavedOverrides] = useState<Record<string, Record<string, SavedEntry>>>({})

  // Timetable
  const [timetable, setTimetable] = useState<Record<string, any[]>>({})

  // Curriculum DB state
  const [gcData, setGcData] = useState<ClassroomCourseData | null>(null)
  const [gcLoading, setGcLoading] = useState(false)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [dbWeeklyTopics, setDbWeeklyTopics] = useState<ClassroomWeeklyTopic[]>([])

  // AI Agent state
  const [aiRunning, setAiRunning] = useState(false)
  const [aiSubjectStatus, setAiSubjectStatus] = useState<Record<string, AIStatus>>({})
  const [aiResults, setAiResults] = useState<Record<string, AIResult>>({})
  const [hitlItem, setHitlItem] = useState<{ item: WeekItem; result: AIResult } | null>(null)

  const fetchCurriculumData = async () => {
    setGcLoading(true)
    try {
      const token = (window as any).__clerk_token
      const res = await fetch(`${BASE_URL}/api/teacher/classes/${classId}/curriculum`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load')
      const data: ClassroomCourseData = await res.json()
      setGcData(data)
      if (data.weekly_topics) setDbWeeklyTopics(data.weekly_topics)
    } catch { /* silent */ } finally { setGcLoading(false) }
  }

  useEffect(() => {
    fetch('/api/timetable').then(r => r.json()).then(setTimetable).catch(console.error)
  }, [])

  // Only fetch curriculum when LMS is connected
  useEffect(() => {
    if (lmsConnected) fetchCurriculumData()
  }, [lmsConnected, classId])

  useEffect(() => {
    const overrides: Record<string, Record<string, SavedEntry>> = {}
    for (let w = 1; w <= 20; w++) {
      const raw = localStorage.getItem(`curriculum_${classId}_week_${w}`)
      if (raw) { try { overrides[String(w)] = JSON.parse(raw) } catch { /* ignore */ } }
    }
    setSavedOverrides(overrides)
  }, [classId])

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

  // Build week → subjects map
  const weekMap: Record<number, WeekItem[]> = {}
  const topicsToRender = dbWeeklyTopics.length > 0 ? dbWeeklyTopics : []
  topicsToRender.forEach(wt => {
    if (subject !== 'All' && wt.subject !== subject) return
    if (!weekMap[wt.week]) weekMap[wt.week] = []
    const override = savedOverrides[String(wt.week)]?.[wt.subject]
    weekMap[wt.week].push({
      subject: wt.subject,
      topic: override?.topic ?? wt.topic,
      learningGoal: override?.learningGoal ?? wt.learningGoal,
    })
  })
  const weeks = Object.keys(weekMap).map(Number).sort((a, b) => a - b)

  // ── AI Agent run ────────────────────────────────────────────────────────────
  const runAiAgent = async () => {
    const currentWeekItems = weekMap[CURRENT_WEEK] ?? []
    if (!currentWeekItems.length) return
    setAiRunning(true)
    // Expand current week
    setExpandedWeeks(prev => new Set([...prev, CURRENT_WEEK]))

    for (const item of currentWeekItems) {
      const key = `${CURRENT_WEEK}_${item.subject}`
      setAiSubjectStatus(prev => ({ ...prev, [key]: 'processing' }))
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500))
      const result = generateAIResult(item.subject, item.topic)
      setAiResults(prev => ({ ...prev, [key]: result }))
      setAiSubjectStatus(prev => ({ ...prev, [key]: 'done' }))
    }
    setAiRunning(false)
    showToast('✅ AI analysis complete for this week!')
  }

  const handleSubjectClick = (item: WeekItem) => {
    const key = `${CURRENT_WEEK}_${item.subject}`
    const result = aiResults[key]
    if (result) setHitlItem({ item, result })
  }

  return (
    <div className="space-y-4">

      {/* ── LMS connection gate ─────────────────────────────────────────────── */}
      {!lmsConnected ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Wifi size={28} className="text-blue-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800 text-base mb-1">Connect your School LMS</p>
            <p className="text-sm text-slate-400 max-w-xs">
              Timetable, lesson plans, and homework will appear after connecting to your school&apos;s learning management system.
            </p>
          </div>
          <button
            onClick={() => setShowLmsModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-full shadow-sm transition-colors"
          >
            <Wifi size={15} /> Connect to School LMS
          </button>
        </div>
      ) : (
        <>
          {/* ── Actions row ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${view === 'list' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}>
                <List size={13} /> List View
              </button>
              <button onClick={() => setView('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${view === 'calendar' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}>
                <Calendar size={13} /> Calendar View
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* AI Agent button */}
              <button
                onClick={runAiAgent}
                disabled={aiRunning || (weekMap[CURRENT_WEEK] ?? []).length === 0}
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
              {/* LMS re-sync */}
              <button onClick={() => setShowLmsModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-200 transition-colors">
                <CheckCircle size={12} /> Synced · Re-sync
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
              <RefreshCw size={14} className="animate-spin mr-2" /> Fetching curriculum from LMS…
            </div>
          )}

          {/* ── List View ─────────────────────────────────────────────────────── */}
          {!gcLoading && view === 'list' && (
            <div className="space-y-3">
              {weeks.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  No curriculum data found. Try re-syncing your LMS.
                </div>
              ) : weeks.map(week => {
                const isCurrentWeek = week === CURRENT_WEEK
                const isExpanded = expandedWeeks.has(week)
                const items = weekMap[week] ?? []
                return (
                  <div key={week}
                    className={`backdrop-blur-xl border rounded-2xl overflow-hidden transition-all shadow-sm
                      ${isCurrentWeek ? 'bg-blue-50/80 border-blue-200' : 'bg-white/70 border-white/60'}`}>
                    <button onClick={() => toggleWeek(week)} className="w-full flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {isCurrentWeek && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500 text-white px-2 py-0.5 rounded-full">This Week</span>
                        )}
                        <span className="font-semibold text-sm text-slate-800">Week {week}</span>
                        <span className="text-xs text-slate-400">{items.length} topic{items.length !== 1 ? 's' : ''}</span>
                        {/* Progress badges for current week */}
                        {isCurrentWeek && (() => {
                          const doneCount = items.filter(i => aiSubjectStatus[`${week}_${i.subject}`] === 'done').length
                          const processingCount = items.filter(i => aiSubjectStatus[`${week}_${i.subject}`] === 'processing').length
                          if (!doneCount && !processingCount) return null
                          return (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              {processingCount > 0 && <span className="text-red-500 font-semibold">{processingCount} running</span>}
                              {doneCount > 0 && <span className="text-emerald-600 font-semibold">{doneCount}/{items.length} done</span>}
                            </span>
                          )
                        })()}
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                      <WeekEditor
                        week={week}
                        items={items}
                        classId={classId}
                        onSaved={(subj, topic, goal) => handleItemSaved(week, subj, topic, goal)}
                        aiStatus={aiSubjectStatus}
                        onSubjectClick={isCurrentWeek ? handleSubjectClick : undefined}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

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
                  <span className="text-sm font-bold text-slate-800">Week {calendarWeek}</span>
                  {calendarWeek === CURRENT_WEEK && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-500 text-white px-2 py-0.5 rounded-full">This Week</span>
                  )}
                </div>
                <button onClick={() => { setCalendarWeek(w => Math.min(TERM_WEEKS, w + 1)); setExpandedCalDay(null) }}
                  disabled={calendarWeek >= TERM_WEEKS}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-30 transition-colors">
                  Next <ChevronRight size={13} />
                </button>
              </div>

              <div className="flex gap-1 px-1">
                {Array.from({ length: TERM_WEEKS }, (_, i) => i + 1).map(w => (
                  <button key={w} onClick={() => { setCalendarWeek(w); setExpandedCalDay(null) }}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                      w === calendarWeek ? 'bg-blue-500' : w === CURRENT_WEEK ? 'bg-blue-200' : 'bg-slate-200 hover:bg-slate-300'
                    }`} title={`Week ${w}`} />
                ))}
              </div>

              <div className="backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-4 shadow-sm">
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, dayIdx) => {
                    const hdrDate = new Date('2026-02-16')
                    hdrDate.setDate(hdrDate.getDate() + ((calendarWeek - 1) * 7) + dayIdx)
                    return (
                      <div key={day} className="text-center text-[10px] font-bold text-slate-400 pb-1.5 border-b border-slate-100">
                        <div>{day.slice(0, 3).toUpperCase()}</div>
                        <div className="text-[9px] font-normal text-slate-300">{hdrDate.getDate()}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, dayIdx) => {
                    const calKey = `${calendarWeek}-${day}`
                    const isExpanded = expandedCalDay === calKey
                    const baseDate = new Date('2026-02-16')
                    baseDate.setDate(baseDate.getDate() + ((calendarWeek - 1) * 7) + dayIdx)
                    const dateStr = baseDate.toISOString().split('T')[0]
                    let rawClasses = timetable[dateStr] || []
                    if (subject !== 'All') rawClasses = rawClasses.filter((c: any) => c.subject === subject)
                    return (
                      <div key={day} className="flex flex-col gap-1">
                        {rawClasses.length > 0 ? rawClasses.map((item: any, slotIdx: number) => {
                          const colClass = SUBJECT_COLORS[item.subject] ?? 'bg-slate-50 border-slate-100 text-slate-600'
                          return (
                            <button key={item.subject + slotIdx}
                              onClick={() => setExpandedCalDay(isExpanded ? null : calKey)}
                              className={`rounded-xl p-2 border text-left w-full transition-all hover:scale-[1.02] ${colClass}`}>
                              <p className="text-[10px] font-bold leading-tight">{item.subject}</p>
                              {item.time && <p className="text-[8px] leading-tight mt-0.5 opacity-60 font-medium">{item.time}</p>}
                              {!isExpanded && <p className="text-[9px] leading-tight mt-0.5 opacity-75 line-clamp-2">{item.topic}</p>}
                            </button>
                          )
                        }) : (
                          <div className="rounded-xl p-2 border border-dashed border-slate-200 min-h-[60px] flex items-center justify-center">
                            <span className="text-[9px] text-slate-300">—</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {expandedCalDay && expandedCalDay.startsWith(`${calendarWeek}-`) && (() => {
                  const expandedDay = expandedCalDay.split('-').slice(1).join('-')
                  const dayIdx = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(expandedDay)
                  const baseDate = new Date('2026-02-16')
                  baseDate.setDate(baseDate.getDate() + ((calendarWeek - 1) * 7) + dayIdx)
                  const dateStr = baseDate.toISOString().split('T')[0]
                  let rawClasses = timetable[dateStr] || []
                  if (subject !== 'All') rawClasses = rawClasses.filter((c: any) => c.subject === subject)
                  if (!rawClasses.length) return null
                  return (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-bold text-slate-600">{expandedDay} — Week {calendarWeek} Details</p>
                      {rawClasses.map((item: any, idx: number) => (
                        <div key={item.subject + idx} className={`rounded-xl p-3 border ${SUBJECT_COLORS[item.subject] ?? 'bg-slate-50 border-slate-100'}`}>
                          <p className="text-xs font-bold">{item.subject}: {item.topic}</p>
                          <p className="text-[10px] mt-1 opacity-75 flex items-start gap-1">
                            <CheckCircle size={10} className="mt-0.5 shrink-0" />
                            {AI_GOALS[item.subject] || 'Students will understand and apply core concepts in this lesson.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                <p className="text-[10px] text-slate-300 mt-3 text-center">
                  Term · Week {calendarWeek} of {TERM_WEEKS} · Tap a subject to expand
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showUploadModal && (
        <UploadModal classId={classId} onClose={() => setShowUploadModal(false)} onSaved={() => showToast('✅ Curriculum entry saved!')} />
      )}
      {showLmsModal && (
        <LmsModal onClose={() => setShowLmsModal(false)} onConnected={() => { setLmsConnected(true); setShowLmsModal(false) }} />
      )}
      {hitlItem && (
        <HitlPopup
          item={hitlItem.item}
          result={hitlItem.result}
          gcData={gcData}
          onClose={() => setHitlItem(null)}
          onResultUpdate={updated => setAiResults(prev => ({
            ...prev,
            [`${CURRENT_WEEK}_${hitlItem.item.subject}`]: updated,
          }))}
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
