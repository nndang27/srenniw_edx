'use client'
import { useEffect, useState } from 'react'
import { useApi } from '@/lib/api'
import { createBrowserClient } from '@/lib/supabase'
import BriefCard from '@/components/teacher/BriefCard'
import type { Brief } from '@/types'

export default function TeacherDashboard() {
  const api = useApi()
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

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">Dashboard</h1>
          <p className="text-sm text-[#999] mt-0.5">Track your messages and parent responses</p>
        </div>
        <a
          href="/teacher/compose"
          className="px-4 py-2.5 bg-[#446dd5] text-white text-sm font-semibold rounded-xl hover:bg-[#315bcf] transition-colors"
        >
          + New Message
        </a>
      </div>

      {classes.length > 0 && (
        <div className="mb-6">
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide block mb-1.5">Class</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="border border-[#eeeeee] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#446dd5] bg-[#f7f8fc] text-[#333]"
          >
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} — {cls.parent_count} parents
              </option>
            ))}
          </select>
        </div>
      )}

      {classes.length === 0 && !loading && (
        <div className="text-center py-16 border border-dashed border-[#dde6ff] rounded-2xl bg-[#f7f8fc]">
          <p className="text-[#999] mb-3">No classes yet.</p>
          <a href="/teacher/compose" className="text-sm font-medium text-[#446dd5] hover:underline">
            Create your first class →
          </a>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-[#eeeeee] rounded-2xl p-5 h-32 bg-[#f7f8fc] animate-pulse" />
          ))
        ) : briefs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#dde6ff] rounded-2xl bg-[#f7f8fc]">
            <p className="text-[#999] mb-1">No messages yet for this class.</p>
            <a href="/teacher/compose" className="text-sm font-medium text-[#446dd5] hover:underline">
              Compose your first message →
            </a>
          </div>
        ) : (
          briefs.map(brief => <BriefCard key={brief.id} brief={brief} />)
        )}
      </div>
    </div>
  )
}
