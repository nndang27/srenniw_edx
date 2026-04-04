'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useApi } from '@/lib/api'
import { createBrowserClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import BriefCard from '@/components/teacher/BriefCard'
import type { Brief } from '@/types'

export default function TeacherDashboard() {
  const api = useApi()
  const { user } = useUser()
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getClasses().then(data => {
      setClasses(data)
      if (data.length > 0) setSelectedClassId(data[0].id)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedClassId) return
    setLoading(true)
    api.getTeacherBriefs(selectedClassId)
      .then(data => setBriefs(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedClassId])

  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase.channel('briefs-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'briefs' }, payload => {
        const updated = payload.new as Brief
        setBriefs(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const stats = [
    { label: 'Total Briefs', value: briefs.length },
    { label: 'Published', value: briefs.filter(b => b.status === 'done').length },
    { label: 'Processing', value: briefs.filter(b => b.status === 'processing').length },
    { label: 'This Week', value: briefs.filter(b => new Date(b.created_at) > new Date(Date.now() - 7 * 86400000)).length },
  ]

  const teacherName = user?.firstName || user?.fullName || 'Teacher'
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {now.getHours() < 12 ? 'morning' : 'afternoon'}, {teacherName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{dateStr}</p>
        </div>
        <a
          href="/teacher/compose"
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          + Compose
        </a>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Class selector */}
      {classes.length > 0 && (
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Class</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#446dd5] bg-white text-slate-700"
          >
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>{cls.name} — {cls.parent_count} parents</option>
            ))}
          </select>
        </div>
      )}

      {classes.length === 0 && !loading && (
        <div className="text-center py-16 border border-dashed border-blue-100 rounded-2xl bg-slate-50">
          <p className="text-slate-500 mb-3">No classes yet.</p>
          <a href="/teacher/compose" className="text-sm font-medium text-[#446dd5] hover:underline">Create your first class →</a>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-slate-100 rounded-2xl p-5 h-32 bg-slate-50 animate-pulse" />
          ))
        ) : briefs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-blue-100 rounded-2xl bg-slate-50">
            <p className="text-slate-500 mb-1">No messages yet for this class.</p>
            <a href="/teacher/compose" className="text-sm font-medium text-[#446dd5] hover:underline">Compose your first message →</a>
          </div>
        ) : (
          briefs.map(brief => <BriefCard key={brief.id} brief={brief} />)
        )}
      </div>
    </div>
  )
}
