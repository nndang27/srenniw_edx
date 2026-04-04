'use client'
import { useEffect, useState } from 'react'
import { Sparkles, Wand2, Users, AlertCircle, TrendingUp, Eye } from 'lucide-react'
import { useApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import type { ContentType, Brief } from '@/types'

export default function ComposePage() {
  const api = useApi()
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [contentType, setContentType] = useState<ContentType>('assignment')
  const [subject, setSubject] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const [rawInput, setRawInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [briefResult, setBriefResult] = useState<{ brief_id: string; status: string } | null>(null)
  const [generatedBrief, setGeneratedBrief] = useState<Brief | null>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api.getClasses()
      .then(data => {
        setClasses(data)
        if (data.length > 0) setSelectedClassId(data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Poll brief status after submission
  useEffect(() => {
    if (!briefResult?.brief_id) return
    const poll = setInterval(async () => {
      const briefs = await api.getTeacherBriefs()
      const found = briefs.find(b => b.id === briefResult.brief_id)
      if (found?.status === 'done') {
        setGeneratedBrief(found)
        clearInterval(poll)
        // Fetch feedback
        api.getBriefFeedback(found.id).then(setFeedback).catch(console.error)
      } else if (found?.status === 'failed') {
        clearInterval(poll)
      }
    }, 2000)
    return () => clearInterval(poll)
  }, [briefResult])

  const handleGenerate = async () => {
    if (!rawInput.trim()) return
    setIsGenerating(true)
    setError(null)
    setBriefResult(null)
    setGeneratedBrief(null)
    try {
      const res = await api.submitCompose({
        class_id: selectedClassId,
        content_type: contentType,
        raw_input: rawInput,
        subject,
        year_level: yearLevel,
      })
      setBriefResult(res)
    } catch (e: any) {
      setError(e?.detail || 'Failed to submit. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = () => {
    setToast('Successfully published! Curriculum digest sent to parents.')
    setTimeout(() => setToast(null), 3000)
  }

  const hasGenerated = !!generatedBrief

  const inputClass = "border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#446dd5] bg-slate-50 text-slate-700 w-full"

  if (loading) return <div className="p-8"><div className="h-64 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" /></div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN — Input */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border-none shadow-sm flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                What are your students learning this week?
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {/* Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Class</label>
                  <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className={inputClass}
                  >
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Type</label>
                  <select
                    value={contentType}
                    onChange={e => setContentType(e.target.value as ContentType)}
                    className={inputClass}
                  >
                    <option value="assignment">Assignment</option>
                    <option value="comment">Comment</option>
                    <option value="weekly_update">Weekly Update</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Year Level</label>
                  <input
                    type="text"
                    value={yearLevel}
                    onChange={e => setYearLevel(e.target.value)}
                    placeholder="e.g. Year 4"
                    className={inputClass}
                  />
                </div>
              </div>

              <Textarea
                placeholder="e.g. Students are learning about fractions this week — specifically equivalent fractions using visual models and number lines..."
                className="flex-1 min-h-[200px] resize-none text-base border-slate-200 focus-visible:ring-[#446dd5]/20 bg-slate-50/50 p-4"
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                data-testid="input-curriculum"
              />

              <div className="flex justify-between text-xs text-slate-400">
                <span />
                <span>{rawInput.length} / 500</span>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !rawInput.trim() || !selectedClassId}
                className="w-full h-12 text-base"
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <><Sparkles className="mr-2 h-5 w-5 animate-spin" /> AI is processing...</>
                ) : (
                  <><Wand2 className="mr-2 h-5 w-5" /> ✨ Generate via CurricuLLM API</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — Preview + Analytics */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Parent Preview */}
          <Card className="border-none shadow-sm overflow-hidden relative">
            {!hasGenerated && !briefResult && (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-500">
                <Wand2 className="h-12 w-12 mb-4 opacity-20" />
                <p>Generate curriculum to see parent preview</p>
              </div>
            )}
            {briefResult && !hasGenerated && (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-500">
                <Sparkles className="h-12 w-12 mb-4 animate-spin text-blue-400" />
                <p className="font-medium">CurricuLLM is simplifying curriculum language...</p>
                <div className="mt-4 w-48">
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full animate-pulse w-2/3" />
                  </div>
                </div>
              </div>
            )}

            <CardHeader className="bg-blue-50/50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Parent Preview
                </CardTitle>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-medium">
                  Parent-Friendly
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <p className="text-slate-700 text-base leading-relaxed">
                  {generatedBrief?.processed_en || 'Your parent-friendly brief will appear here once generated.'}
                </p>
              </div>

              {generatedBrief?.at_home_activities && generatedBrief.at_home_activities.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">🏠 At-Home Activities:</p>
                  <div className="space-y-2">
                    {generatedBrief.at_home_activities.map((act, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                        <span className="text-sm text-slate-700">{act.title}</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {act.duration_mins} min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {['EN', 'VI', 'ZH', 'AR'].map(lang => (
                  <span key={lang} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{lang}</span>
                ))}
              </div>

              <Button
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3"
                disabled={!hasGenerated}
                onClick={handlePublish}
                data-testid="button-publish"
              >
                📤 Publish to Parents
              </Button>
            </CardContent>
          </Card>

          {/* Class Insights */}
          <Card className="border-none shadow-sm flex-1 relative">
            {!hasGenerated && (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 rounded-2xl" />
            )}
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-500" />
                Class Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Class Understanding</span>
                  <span className="font-bold text-emerald-600">70% at Applies level</span>
                </div>
                <Progress value={70} className="h-3 bg-slate-100" indicatorColor="bg-emerald-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900 text-sm">Attention Needed</p>
                    <p className="text-xs text-orange-700 mt-1">3 students showing frustration</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Extension Ready</p>
                    <p className="text-xs text-blue-700 mt-1">2 students ready for extension</p>
                  </div>
                </div>
              </div>

              {feedback?.messages?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Recent Feedback</p>
                  {feedback.messages.slice(0, 3).map((msg: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">P</div>
                      <p className="text-sm text-slate-600">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-slate-800">18/22</p>
                  <p className="text-xs text-slate-500">Opened</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-slate-800">{feedback?.total_feedback || 0}</p>
                  <p className="text-xs text-slate-500">Replied</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-slate-800">4</p>
                  <p className="text-xs text-slate-500">Activities tried</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
