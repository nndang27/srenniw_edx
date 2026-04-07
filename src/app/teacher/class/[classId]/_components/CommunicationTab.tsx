'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Zap, Users, User, MessageSquare, Bell, BookOpen, X, Calendar, FileText, Camera, Check, Upload, Search, ChevronDown } from 'lucide-react'
import type { TeacherClass } from '@/lib/mockTeacherData'

const MESSAGE_TYPES = [
  { id: 'update', label: 'Weekly Update', icon: Bell },
  { id: 'reminder', label: 'Reminder', icon: Bell },
  { id: 'activity', label: 'At-Home Activity', icon: BookOpen },
  { id: 'concern', label: 'Concern', icon: User },
  { id: 'praise', label: 'Praise', icon: MessageSquare },
]

const RECENT_MESSAGES = [
  { id: 1, to: 'All Parents', type: 'Weekly Update', preview: 'This week we covered fractions and equivalent decimals...', date: '2026-04-05', status: 'sent' },
  { id: 2, to: 'Emily Watson', type: 'Concern', preview: 'I wanted to share some observations about Emily\'s engagement...', date: '2026-04-04', status: 'read' },
  { id: 3, to: 'All Parents', type: 'At-Home Activity', preview: 'Try this fun science experiment at home using household items...', date: '2026-04-03', status: 'sent' },
  { id: 4, to: 'James O\'Brien', type: 'Praise', preview: 'James had an outstanding week — his reading comprehension...', date: '2026-04-02', status: 'read' },
]

const AI_DRAFTS: Record<string, string> = {
  update: `Dear Families,\n\nThis week your child has been exploring exciting concepts across all subjects. In Maths, we continued our unit on fractions, and students are showing great progress in understanding equivalent forms.\n\nIn English, we focused on narrative writing techniques — many students produced impressive creative pieces. Science this week involved hands-on investigation into states of matter.\n\nAt-home activity: Ask your child to find three examples of fractions in everyday life (pizza slices, measuring cups, clocks).\n\nHave a wonderful weekend,\nMs Johnson`,
  activity: `Dear Families,\n\nHere's a fun activity to reinforce what we've been learning in class!\n\n🔬 Science at Home: Kitchen Chemistry\nYou'll need: baking soda, vinegar, food colouring, a container\n1. Add 2 tablespoons of baking soda to the container\n2. Add a few drops of food colouring\n3. Slowly pour in vinegar and observe!\n\nAsk your child: What gas is being produced? Where else do we see this reaction?\n\nThis ties directly to our current unit on chemical reactions. Take a photo and share it with us!\n\nWarm regards,\nMs Johnson`,
  concern: `Dear [Parent/Guardian],\n\nI hope this message finds you well. I wanted to reach out to share some observations from recent weeks and open a conversation about how we can best support your child.\n\nI've noticed some changes in engagement and confidence levels that I'd like to discuss. This is completely normal during this stage of the term, and with the right support both at home and in school, I'm confident we can get things back on track.\n\nWould you be available for a brief call or meeting this week? I'm happy to work around your schedule.\n\nKind regards,\nMs Johnson`,
  praise: `Dear [Parent/Guardian],\n\nI just had to share some wonderful news — your child has had a truly outstanding week!\n\nThe effort, enthusiasm and quality of work has been exceptional. Particularly in our recent project, the level of thinking and creativity on display was impressive and a real credit to your child.\n\nThank you for the support you provide at home — it clearly makes a difference. Keep encouraging that curiosity!\n\nWith warm regards,\nMs Johnson`,
  reminder: `Dear Families,\n\nJust a friendly reminder about upcoming events and tasks:\n\n📚 Reading logs are due this Friday — please ensure your child's log is signed and returned\n📅 Parent-teacher interviews are scheduled for next Thursday and Friday. Booking links were sent last week — please confirm your time slot\n🎨 Creative Arts materials needed: please send in any clean recyclables by Monday for our upcoming sculpture project\n\nThank you for your continued support!\n\nMs Johnson`,
}

interface Props {
  cls: TeacherClass
}

export default function CommunicationTab({ cls }: Props) {
  const [recipient, setRecipient] = useState<'all' | string>('all')
  const [messageType, setMessageType] = useState('update')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Quick action modal states
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportCopied, setReportCopied] = useState(false)
  const [showPhotosModal, setShowPhotosModal] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoRecipient, setPhotoRecipient] = useState('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Searchable dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownSearch, setDropdownSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const mockReportUrl = `https://learnbridge.app/reports/${cls.id}/term2-week8`

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleScheduleMeeting = () => {
    const start = '20260415T090000'
    const end = '20260415T093000'
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Parent-Teacher Meeting — ' + cls.name)}&dates=${start}/${end}&details=${encodeURIComponent('Meeting with families of ' + cls.name + '. Agenda: term progress, learning goals, and upcoming activities.')}`
    window.open(url, '_blank')
  }

  const handleCopyReportLink = async () => {
    try {
      await navigator.clipboard.writeText(mockReportUrl)
      setReportCopied(true)
      setTimeout(() => setReportCopied(false), 2000)
    } catch {
      setReportCopied(true)
      setTimeout(() => setReportCopied(false), 2000)
    }
  }

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleGenerate = () => {
    setGenerating(true)
    setBody('')
    const draft = AI_DRAFTS[messageType] ?? AI_DRAFTS.update
    let i = 0
    const interval = setInterval(() => {
      i++
      setBody(draft.slice(0, i * 3))
      if (i * 3 >= draft.length) {
        clearInterval(interval)
        setBody(draft)
        setGenerating(false)
      }
    }, 16)
  }

  const handleSend = () => {
    if (!body.trim()) return
    showToast(`✅ Message sent to ${recipient === 'all' ? 'all parents' : cls.students.find(s => s.id === recipient)?.name ?? 'parent'}`)
    setBody('')
  }

  const recipientName = recipient === 'all'
    ? 'All Parents'
    : cls.students.find(s => s.id === recipient)?.name ?? 'Parent'

  return (
    <div className="space-y-5">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleScheduleMeeting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/70 border border-white/60 rounded-full text-slate-600 hover:bg-white hover:shadow-sm transition-all backdrop-blur-xl"
        >
          <Calendar size={12} /> Schedule Meeting
        </button>
        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/70 border border-white/60 rounded-full text-slate-600 hover:bg-white hover:shadow-sm transition-all backdrop-blur-xl"
        >
          <FileText size={12} /> Share Report
        </button>
        <button
          onClick={() => setShowPhotosModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/70 border border-white/60 rounded-full text-slate-600 hover:bg-white hover:shadow-sm transition-all backdrop-blur-xl"
        >
          <Camera size={12} /> Share Photos
        </button>
      </div>

      <div className="grid sm:grid-cols-5 gap-5">
        {/* Compose panel */}
        <div className="sm:col-span-3 backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-500" />
            Compose Message
          </h3>

          {/* Recipient */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">To</label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setRecipient('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${recipient === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
              >
                <Users size={11} /> All Parents
              </button>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => { setIsDropdownOpen(!isDropdownOpen); setDropdownSearch('') }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                    ${recipient !== 'all' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white/70 text-slate-400 border-slate-200 hover:bg-white'}`}
                >
                  <User size={11} className={recipient !== 'all' ? 'text-blue-500' : 'text-slate-300'} />
                  {recipient === 'all' ? 'Select individual…' : cls.students.find(s => s.id === recipient)?.name + "'s parent"}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-left">
                    <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                      <div className="relative">
                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          autoFocus
                          value={dropdownSearch}
                          onChange={e => setDropdownSearch(e.target.value)}
                          placeholder="Search parents..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-300 shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1.5">
                      {cls.students
                        .filter(s => s.name.toLowerCase().includes(dropdownSearch.toLowerCase()))
                        .map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setRecipient(s.id); setIsDropdownOpen(false) }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors text-left
                              ${recipient === s.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.avatar} alt={s.name} className="w-5 h-5 rounded-full shrink-0" />
                            <span className="truncate">{s.name}&apos;s parent</span>
                            {recipient === s.id && <Check size={10} className="ml-auto text-blue-500" />}
                          </button>
                        ))}
                      {cls.students.filter(s => s.name.toLowerCase().includes(dropdownSearch.toLowerCase())).length === 0 && (
                        <p className="text-[10px] text-slate-400 py-4 text-center">No parents found for &quot;{dropdownSearch}&quot;</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message type */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TYPES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setMessageType(id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                    ${messageType === id ? 'bg-violet-500 text-white border-violet-500' : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message here, or click AI Generate…"
              rows={9}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-300 resize-none leading-relaxed"
            />
            {generating && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-violet-500 font-semibold">
                <span className="animate-pulse">✨ Generating…</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
            >
              <Zap size={13} /> AI Generate
            </button>
            <button
              onClick={handleSend}
              disabled={!body.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
            >
              <Send size={13} /> Send to {recipientName}
            </button>
          </div>
        </div>

        {/* Recent messages */}
        <div className="sm:col-span-2 backdrop-blur-xl bg-white/70 border border-white/60 rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
            <Bell size={14} className="text-amber-500" /> Recent Messages
          </h3>
          <div className="space-y-3">
            {RECENT_MESSAGES.map(msg => (
              <div key={msg.id} className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-600">{msg.to}</span>
                  <span className="text-[10px] text-slate-400">{msg.date.slice(5)}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold">{msg.type}</span>
                <p className="text-xs text-slate-500 mt-1.5 leading-snug line-clamp-2">{msg.preview}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${msg.status === 'read' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <span className="text-[10px] text-slate-400 capitalize">{msg.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={16} className="text-blue-500" /> Report Link Generated!</h2>
              <button onClick={() => setShowReportModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Share this link with parents to access the Term 2 Week 8 progress report.</p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-4">
              <span className="flex-1 text-xs text-slate-600 truncate">{mockReportUrl}</span>
              <button
                onClick={handleCopyReportLink}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${reportCopied ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                {reportCopied ? <><Check size={11} /> Copied!</> : 'Copy'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { showToast('📧 Report link sent via email to all parents'); setShowReportModal(false) }}
                className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold"
              >Share via Email</button>
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Photos Modal */}
      {showPhotosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Camera size={16} className="text-pink-500" /> Share Class Photos</h2>
              <button onClick={() => { setShowPhotosModal(false); setPhotoFiles([]); setPhotoCaption('') }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoFileChange} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors mb-3"
            >
              <Upload size={22} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">Click to upload photos</p>
              <p className="text-xs text-slate-300 mt-0.5">or drag & drop images here</p>
            </button>
            {photoFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {photoFiles.map((f, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotoFiles(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white"
                    ><X size={8} /></button>
                  </div>
                ))}
              </div>
            )}
            <input
              value={photoCaption}
              onChange={e => setPhotoCaption(e.target.value)}
              placeholder="Add a caption… (e.g. Science experiment day!)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 mb-3"
            />
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Recipients</label>
              <select
                value={photoRecipient}
                onChange={e => setPhotoRecipient(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 bg-white"
              >
                <option value="all">All Parents ({cls.students.length})</option>
                {cls.students.map(s => <option key={s.id} value={s.id}>{s.name}&apos;s Parent</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  showToast(`📸 ${photoFiles.length || 'Class'} photo${photoFiles.length !== 1 ? 's' : ''} shared with parents`)
                  setShowPhotosModal(false)
                  setPhotoFiles([])
                  setPhotoCaption('')
                }}
                className="flex-1 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold"
              >Share Photos</button>
              <button onClick={() => { setShowPhotosModal(false); setPhotoFiles([]); setPhotoCaption('') }} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  )
}
