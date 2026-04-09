'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Users, ChevronRight, Loader2 } from 'lucide-react'
import { useApi } from '@/lib/api'

const SUBJECT_COLORS: Record<string, string> = {
  Maths: 'bg-blue-100 text-blue-700',
  Science: 'bg-emerald-100 text-emerald-700',
  English: 'bg-violet-100 text-violet-700',
  HSIE: 'bg-amber-100 text-amber-700',
  'Creative Arts': 'bg-pink-100 text-pink-700',
  PE: 'bg-orange-100 text-orange-700',
}

const SUBJECTS = ['Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE']
const CARD_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
]

// Fetch data types
type TeacherClass = {
  id: string
  name: string
  studentCount: number
  students: any[]
}

export default function TeacherLandingPage() {
  const { user } = useUser()
  const router = useRouter()
  const api = useApi()
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getClasses()
      .then((data: any[]) => {
        const classList: TeacherClass[] = data.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          studentCount: cls.student_count ?? 0,
          students: [],
        }))
        setClasses(classList)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const teacherName = user?.firstName || user?.fullName || 'Teacher'

  const handleClassClick = (classId: string) => {
    setExpandedClass(prev => (prev === classId ? null : classId))
  }

  const handleSubjectSelect = (classId: string, subject: string) => {
    router.push(`/teacher/class/${classId}?subject=${encodeURIComponent(subject)}`)
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-57px)] px-4 sm:px-8 py-8 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {greeting}, {teacherName} 👋
        </h1>
        <p className="text-slate-500 mt-1">Select a class to get started</p>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {classes.length === 0 && <div className="col-span-3 text-slate-400">No classes assigned.</div>}
        {classes.map((cls, idx) => {
          const isExpanded = expandedClass === cls.id
          const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length]

          return (
            <div key={cls.id} className="flex flex-col gap-3">
              {/* Card */}
              <button
                onClick={() => handleClassClick(cls.id)}
                className={`text-left backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${isExpanded ? 'ring-2 ring-blue-400' : ''}`}
              >
                {/* Top gradient band */}
                <div className={`bg-gradient-to-r ${grad} px-5 py-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">{cls.name}</span>
                    <ChevronRight
                      size={18}
                      className={`text-white/80 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Users size={13} className="text-white/70" />
                    <span className="text-white/80 text-sm">{cls.studentCount} students</span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                  {/* Subject pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {SUBJECTS.map(subj => (
                      <span
                        key={subj}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SUBJECT_COLORS[subj] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {subj}
                      </span>
                    ))}
                  </div>

                  {/* Quick info */}
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Students</p>
                      <p className="text-base font-bold text-slate-800">{cls.studentCount}</p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Subject Selector — expands below card */}
              {isExpanded && (
                <div className="backdrop-blur-xl bg-white/80 border border-white/60 rounded-2xl shadow-lg p-4 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Select subject
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['All', ...SUBJECTS].map(subj => (
                      <button
                        key={subj}
                        onClick={() => handleSubjectSelect(cls.id, subj)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95
                          ${subj === 'All'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : `${SUBJECT_COLORS[subj] ?? 'bg-slate-100 text-slate-600'} border-transparent`
                          }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
