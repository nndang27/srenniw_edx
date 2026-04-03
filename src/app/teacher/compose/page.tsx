'use client'
import { useEffect, useState } from 'react'
import { useApi } from '@/lib/api'
import ComposeForm from '@/components/teacher/ComposeForm'

export default function ComposePage() {
  const api = useApi()
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showCreateClass, setShowCreateClass] = useState(false)
  const [newClass, setNewClass] = useState({ name: '', year_level: '', subject: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.getClasses().then(data => {
      setClasses(data)
      if (data.length > 0) setSelectedClassId(data[0].id)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleCreateClass = async () => {
    setCreating(true)
    try {
      const created = await api.createClass(newClass)
      setClasses(prev => [...prev, created])
      setSelectedClassId(created.id)
      setShowCreateClass(false)
      setNewClass({ name: '', year_level: '', subject: '' })
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  const inputClass = "border border-[#eeeeee] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#446dd5] bg-[#f7f8fc] text-[#333]"

  if (loading) return <div className="p-8"><div className="h-64 bg-[#f7f8fc] rounded-2xl animate-pulse border border-[#eeeeee]" /></div>

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#333]">Compose Message</h1>
        <p className="text-sm text-[#999] mt-1">
          Write your message. The AI will simplify the language, suggest at-home activities, and translate it for parents.
        </p>
      </div>

      {/* Class selector */}
      <div className="mb-7">
        <label className="text-xs font-semibold text-[#666] uppercase tracking-wide block mb-1.5">Select Class</label>
        <div className="flex gap-2">
          {classes.length > 0 ? (
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className={`${inputClass} flex-1`}
            >
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-[#999] italic">No classes yet.</p>
          )}
          <button
            onClick={() => setShowCreateClass(!showCreateClass)}
            className="px-3 py-2 border border-[#eeeeee] rounded-xl text-sm text-[#446dd5] font-medium hover:bg-[#eef2ff] transition-colors"
          >
            + New Class
          </button>
        </div>

        {showCreateClass && (
          <div className="mt-3 p-5 border border-[#dde6ff] rounded-2xl bg-[#f7f8fc] space-y-3">
            <p className="text-sm font-semibold text-[#333]">Create New Class</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                placeholder="Class name (e.g. 4B - Maths)"
                value={newClass.name}
                onChange={e => setNewClass(p => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
              <input
                placeholder="Year Level"
                value={newClass.year_level}
                onChange={e => setNewClass(p => ({ ...p, year_level: e.target.value }))}
                className={inputClass}
              />
              <input
                placeholder="Subject"
                value={newClass.subject}
                onChange={e => setNewClass(p => ({ ...p, subject: e.target.value }))}
                className={inputClass}
              />
            </div>
            <button
              onClick={handleCreateClass}
              disabled={!newClass.name || creating}
              className="px-4 py-2 bg-[#446dd5] text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-[#315bcf] transition-colors"
            >
              {creating ? 'Creating…' : 'Create Class'}
            </button>
          </div>
        )}
      </div>

      {selectedClassId && <ComposeForm classId={selectedClassId} />}
    </div>
  )
}
