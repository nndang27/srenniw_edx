'use client'
import { useState } from 'react'
import { useApi } from '@/lib/api'
import type { ContentType } from '@/types'

interface Props {
  classId: string
}

export default function ComposeForm({ classId }: Props) {
  const api = useApi()
  const [contentType, setContentType] = useState<ContentType>('assignment')
  const [subject, setSubject] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const [rawInput, setRawInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ brief_id: string; status: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.submitCompose({
        class_id: classId,
        content_type: contentType,
        raw_input: rawInput,
        subject,
        year_level: yearLevel,
      })
      setResult(res)
      setRawInput('')
    } catch (err: any) {
      setError(err?.detail || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-[#eeeeee] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#446dd5] focus:border-transparent transition-colors bg-[#f7f8fc]"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide block mb-1.5">Type</label>
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
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide block mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#666] uppercase tracking-wide block mb-1.5">Year Level</label>
          <input
            type="text"
            value={yearLevel}
            onChange={e => setYearLevel(e.target.value)}
            placeholder="e.g. Year 4"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-[#666] uppercase tracking-wide block mb-1.5">
          Message to parents
        </label>
        <textarea
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          placeholder="Write your message here. The AI will simplify it, add at-home activities, and translate it for parents."
          rows={6}
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {result && (
        <div className="text-sm text-[#446dd5] bg-[#eef2ff] border border-[#c3d3fb] rounded-xl px-4 py-3">
          <strong>Processing — submitted!</strong> The AI is translating and creating activities. Check the Dashboard for updates.
        </div>
      )}

      <button
        type="submit"
        disabled={!rawInput.trim() || loading}
        className="px-6 py-2.5 bg-[#446dd5] text-white text-sm font-semibold rounded-xl hover:bg-[#315bcf] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Sending...' : 'Send to Parents'}
      </button>
    </form>
  )
}
