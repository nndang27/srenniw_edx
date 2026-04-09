'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, LayoutDashboard, BookOpen, BarChart2, MessageSquare, Table } from 'lucide-react'
import { SUBJECTS } from '@/lib/mockTeacherData'
import type { TeacherClass } from '@/lib/mockTeacherData'
import { useApi } from '@/lib/api'
import OverviewTab from './_components/OverviewTab'
import CurriculumTab from './_components/CurriculumTab'
import InsightsTab from './_components/InsightsTab'
import CommunicationTab from './_components/CommunicationTab'
import TranscriptTab from './_components/TranscriptTab'

const SUBJECT_COLORS: Record<string, string> = {
  Maths: 'bg-blue-100 text-blue-700 ring-blue-200',
  Science: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  English: 'bg-violet-100 text-violet-700 ring-violet-200',
  HSIE: 'bg-amber-100 text-amber-700 ring-amber-200',
  'Creative Arts': 'bg-pink-100 text-pink-700 ring-pink-200',
  PE: 'bg-orange-100 text-orange-700 ring-orange-200',
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { id: 'insights', label: 'Insights', icon: BarChart2 },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'transcript', label: 'Transcript', icon: Table },
] as const

type TabId = typeof TABS[number]['id']

export default function ClassDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const classId = params.classId as string
  const api = useApi()

  const initialSubject = searchParams.get('subject') ?? 'All'
  const initialTab = (searchParams.get('tab') as TabId) ?? 'overview'
  const [activeTab, setActiveTab] = useState<TabId>(TABS.some(t => t.id === initialTab) ? initialTab : 'overview')
  const [subject, setSubject] = useState(initialSubject)
  const [cls, setCls] = useState<TeacherClass | null>(null)
  const [loadingClass, setLoadingClass] = useState(true)
  // activeSubjectId: which subject-class UUID is selected (controls Curriculum + Transcript)
  const [activeSubjectId, setActiveSubjectId] = useState<string>(classId)
  // Mutex for AI generation - persists across tab switches to prevent infinite loops
  const aiRunningRef = useRef(false)

  useEffect(() => {
    Promise.all([
      api.getClasses(),
      api.getClassStudents(classId),
    ]).then(([classes, students]) => {
      // Support both grouped (new) and legacy flat responses
      let classInfo = classes.find((c: any) => c.id === classId)
      // If classId is a subject-specific UUID, search inside subjects arrays
      if (!classInfo) {
        classInfo = classes.find((c: any) =>
          (c.subjects || []).some((s: any) => s.id === classId)
        )
      }
      if (classInfo) {
        const subjects = classInfo.subjects || []
        // Determine which subject UUID is "active" — prefer the one matching the URL classId
        const matchedSubject = subjects.find((s: any) => s.id === classId)
        if (matchedSubject) setActiveSubjectId(classId)
        else if (subjects.length > 0) setActiveSubjectId(subjects[0].id)

        setCls({
          id: classInfo.id,
          name: classInfo.name,
          studentCount: students.length,
          students,
          subjects,
        })
      }
    }).catch(console.error).finally(() => setLoadingClass(false))
  }, [classId])

  if (loadingClass) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)]">
        <p className="text-slate-400 animate-pulse">Loading class…</p>
      </div>
    )
  }

  if (!cls) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)]">
        <p className="text-slate-400">Class not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-white/40 backdrop-blur-xl bg-white/40 px-3 py-4 lg:py-6 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]">
        {/* Back button */}
        <button
          onClick={() => router.push('/teacher')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all shrink-0 mb-1"
        >
          <ArrowLeft size={13} /> All Classes
        </button>

        <div className="hidden lg:block px-3 mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cls.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{cls.studentCount} students</p>
        </div>

        {/* Nav items */}
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0
              ${activeTab === id
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{cls.name} — {TABS.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'overview' && 'Class-wide engagement and wellbeing at a glance'}
              {activeTab === 'curriculum' && 'Weekly topics, learning goals, and curriculum upload'}
              {activeTab === 'insights' && 'Deep-dive analytics — class and individual views'}
              {activeTab === 'communication' && 'Compose and send messages to parents'}
              {activeTab === 'transcript' && 'Weekly assignment grades for all students'}
            </p>
          </div>

          {/* Subject pills — for overview/insights: filter display; for curriculum/transcript: switch data source */}
          {cls.subjects && cls.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {/* "All" pill for overview/insights/curriculum/transcript */}
              {(activeTab === 'overview' || activeTab === 'insights' || activeTab === 'curriculum') && (
                <button
                  onClick={() => {
                    setSubject('All')
                    // fallback to classId if reverting to All, though not strictly required
                    setActiveSubjectId(classId)
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                    ${subject === 'All' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
                >
                  All
                </button>
              )}
              {cls.subjects.map(subj => {
                const isActive = activeTab === 'curriculum' || activeTab === 'transcript'
                  ? activeSubjectId === subj.id && subject !== 'All'
                  : subject === subj.subject
                return (
                  <button
                    key={subj.id}
                    onClick={() => {
                      setSubject(subj.subject)
                      setActiveSubjectId(subj.id)
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                      ${isActive
                        ? `ring-1 ${SUBJECT_COLORS[subj.subject] ?? 'bg-slate-100 text-slate-700 ring-slate-300'}`
                        : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'
                      }`}
                  >
                    {subj.subject}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Tab content - Use persistent rendering to avoid re-fetches and preserve state */}
        <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
          <OverviewTab cls={cls} subject={subject} />
        </div>

        <div className={activeTab === 'curriculum' ? 'block' : 'hidden'}>
          <CurriculumTab
            classId={activeSubjectId}
            subject={subject}
            aiRunningRef={aiRunningRef}
            onSubjectChange={(newSubj) => {
              const sObj = cls.subjects?.find(s => s.subject === newSubj)
              if (sObj) {
                setSubject(sObj.subject)
                setActiveSubjectId(sObj.id)
              }
            }}
          />
        </div>

        <div className={activeTab === 'insights' ? 'block' : 'hidden'}>
          <InsightsTab cls={cls} subject={subject} />
        </div>

        <div className={activeTab === 'communication' ? 'block' : 'hidden'}>
          <CommunicationTab cls={cls} />
        </div>

        <div className={activeTab === 'transcript' ? 'block' : 'hidden'}>
          <TranscriptTab classId={activeSubjectId} />
        </div>
      </main>
    </div>
  )
}
