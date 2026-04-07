'use client'
import { useState, useEffect } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, FileText, Award, Download, Calendar, ChevronDown, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { SUBJECT_COLORS, type SubjectName } from '@/lib/mockTimetable'

const SUBJECTS: SubjectName[] = ['Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE']

type SemesterId = 'Semester 1' | 'Semester 2'

type GradeSummary = {
  subject: SubjectName
  achievement: string
  grade: string
  effort: string
  comment: string
  score: number
}

type TermData = {
  status: 'completed' | 'in-progress' | 'future'
  reportNote?: string
  grades: GradeSummary[]
}

function AchievementBadge({ achievement }: { achievement: string }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-200'
  if (achievement.includes('Exceeding')) color = 'bg-emerald-100 text-emerald-800 border-emerald-200'
  else if (achievement.includes('Meeting')) color = 'bg-blue-100 text-blue-800 border-blue-200'
  else if (achievement.includes('Working')) color = 'bg-amber-100 text-amber-800 border-amber-200'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>{achievement}</span>
}

function GradeBadge({ grade }: { grade: string }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-200'
  if (grade.startsWith('A')) color = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  else if (grade.startsWith('B')) color = 'bg-blue-50 text-blue-700 border-blue-200'
  else if (grade.startsWith('C')) color = 'bg-amber-50 text-amber-700 border-amber-200'
  else if (grade.startsWith('D') || grade.startsWith('E')) color = 'bg-red-50 text-red-700 border-red-200'
  return <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${color}`}>{grade}</span>
}

function TermInsightPanel({ termData }: { termData: TermData }) {
  if (termData.status === 'future' || termData.grades.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-lg p-6 flex flex-col h-64 items-center justify-center text-center">
        <Clock className="w-10 h-10 text-slate-300 mb-3" />
        <h3 className="text-slate-500 font-bold">Semester Insights Not Available</h3>
        <p className="text-sm text-slate-400 mt-1">Insights will appear once grades are recorded.</p>
      </div>
    )
  }

  const radarData = SUBJECTS.map(sub => {
    const grade = termData.grades.find(g => g.subject === sub)
    const avgLevel = grade ? parseFloat(((grade.score / 100) * 5).toFixed(1)) : 0
    return { subject: sub, avgLevel }
  })

  const topSubject = [...termData.grades].sort((a, b) => b.score - a.score)[0]
  const needsFocus = [...termData.grades].sort((a, b) => a.score - b.score)[0]

  return (
    <div className="backdrop-blur-xl bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={18} className="text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-900">Semester Insight & Cognitive Balance</h3>
      </div>

      {topSubject ? (
        <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="mb-2"><strong>AI Analysis:</strong> This semester shows strong cognitive development particularly in <strong>{topSubject.subject}</strong> where an outstanding score of {topSubject.score}% was achieved.</p>
          <p>Consider dedicating some extra review time to <strong>{needsFocus?.subject || 'weaker subjects'}</strong> to bring it into balance with stronger subjects.</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mb-4">Not enough data to form an analysis.</p>
      )}

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
            <Radar name="Avg Level" dataKey="avgLevel" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={3} />
            <Tooltip formatter={(v) => [`${v} / 5`, 'Balance Level']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', zIndex: 1000 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function TranscriptPage() {
  const [activeYear, setActiveYear] = useState<string>('2026')
  const [activeSemester, setActiveSemester] = useState<SemesterId>('Semester 1')
  const [termData, setTermData] = useState<TermData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/transcript?year=${activeYear}&semester=${encodeURIComponent(activeSemester)}`)
        const data = await res.json()
        setTermData({ status: data.status, reportNote: data.reportNote, grades: data.grades ?? [] })
      } catch (err) {
        console.error(err)
        setTermData({ status: 'future', grades: [] })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeYear, activeSemester])

  const gradesData = termData?.grades || []
  const semesterTabs: SemesterId[] = activeYear === '2026' ? ['Semester 1'] : ['Semester 1', 'Semester 2']

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-500" />
            Academic Transcript
          </h1>
          <p className="text-slate-500 text-sm">Review semester grades and download detailed records.</p>
        </div>

        {/* Year Selector */}
        <div className="relative shrink-0">
          <select
            value={activeYear}
            onChange={(e) => {
              setActiveYear(e.target.value)
              setActiveSemester('Semester 1')
            }}
            className="appearance-none bg-white border border-slate-200 text-slate-800 font-bold py-2 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-40"
          >
            <option value="2026">2026 Year</option>
            <option value="2025">2025 Year</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Semester Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          {semesterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSemester(tab)}
              className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all mb-[-2px] ${
                activeSemester === tab
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          disabled={termData?.status === 'future' || gradesData.length === 0}
          onClick={() => alert(`Downloading detailed transcript for ${activeYear} ${activeSemester}…`)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full shadow-md transition-all active:scale-95"
        >
          <Download size={16} />
          <span>Download Transcript</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  {activeSemester} Summary
                </h2>

                <div className="flex items-center">
                  {termData?.status === 'completed' && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle2 size={14}/> Completed</span>}
                  {termData?.status === 'in-progress' && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      <Clock size={14}/> {termData.reportNote ?? 'In Progress'}
                    </span>
                  )}
                  {termData?.status === 'future' && <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full"><Calendar size={14}/> Not Started</span>}
                </div>
              </div>

              <div className="divide-y divide-slate-100 flex-1">
                {termData?.status === 'future' || gradesData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <Calendar className="w-12 h-12 mb-4 text-slate-200" />
                    <p className="font-medium text-slate-500">No grades recorded for this period.</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {gradesData.map((item, idx) => (
                      <div key={idx} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:bg-slate-50/50 transition-colors">
                        <div className="sm:w-36 shrink-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: SUBJECT_COLORS[item.subject] || '#cbd5e1' }} />
                            <span className="font-bold text-slate-800 text-base">{item.subject}</span>
                          </div>
                          <div className="text-2xl font-black text-slate-300 tabular-nums">
                            {item.score}<span className="text-sm">%</span>
                          </div>
                          <GradeBadge grade={item.grade} />
                        </div>

                        <div className="flex-1 flex flex-col gap-2.5">
                          <div className="flex flex-wrap gap-2">
                            <AchievementBadge achievement={item.achievement} />
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Effort: {item.effort}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed italic">
                            &ldquo;{item.comment}&rdquo;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {termData && <TermInsightPanel termData={termData} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
