'use client'
import { useState, useEffect, useRef } from 'react'
import { X, User, BookOpen, Bell, Globe, Save, Plus } from 'lucide-react'

const SUBJECTS = ['All Subjects', 'Maths', 'Science', 'English', 'HSIE', 'Creative Arts', 'PE']

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇦🇺' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', label: '普通话', flag: '🇨🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
]

const MOCK_CLASSES = [
  { id: 'cls-1', name: 'Year 4A', count: 22 },
  { id: 'cls-2', name: 'Year 4B', count: 20 },
  { id: 'cls-3', name: 'Year 5A', count: 24 },
]

const SECTIONS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'classes', label: 'My Classes', icon: BookOpen },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language', icon: Globe },
]

interface Settings {
  name: string
  email: string
  school: string
  subject: string
  yearsExp: string
  notifyNewJournal: boolean
  notifyParentMessage: boolean
  notifyWeeklySummary: boolean
  language: string
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function TeacherSettingsModal({ open, onClose }: Props) {
  const [section, setSection] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    name: 'Ms Sarah Johnson',
    email: 'sarah.johnson@northside.edu.au',
    school: 'Northside Primary School',
    subject: 'All Subjects',
    yearsExp: '8',
    notifyNewJournal: true,
    notifyParentMessage: true,
    notifyWeeklySummary: false,
    language: 'en',
  })
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const stored = localStorage.getItem('teacherSettings')
    if (stored) {
      try { setSettings(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  const handleSave = () => {
    localStorage.setItem('teacherSettings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: val }))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div ref={modalRef} className="w-full max-w-xl bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800 text-lg">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 shrink-0 border-r border-slate-100 py-3">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors text-left
                  ${section === id ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={14} className={section === id ? 'text-blue-500' : 'text-slate-400'} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-5 space-y-4">

            {section === 'profile' && (
              <>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl">👩‍🏫</div>
                  <div>
                    <button className="text-xs font-semibold text-blue-500 hover:underline">Change photo</button>
                    <p className="text-[10px] text-slate-400 mt-0.5">JPG or PNG, max 2 MB</p>
                  </div>
                </div>
                {[
                  { label: 'Full Name', key: 'name' as const, type: 'text', readonly: false },
                  { label: 'Email', key: 'email' as const, type: 'email', readonly: true },
                  { label: 'School', key: 'school' as const, type: 'text', readonly: false },
                ].map(({ label, key, type, readonly }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">{label}</label>
                    <input
                      type={type}
                      value={settings[key]}
                      onChange={e => !readonly && set(key, e.target.value)}
                      readOnly={readonly}
                      className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-colors
                        ${readonly ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-default' : 'border-slate-200 focus:border-blue-300 bg-white'}`}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Primary Subject</label>
                  <select
                    value={settings.subject}
                    onChange={e => set('subject', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300 bg-white"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Years of Experience</label>
                  <input
                    type="number" min="0" max="50"
                    value={settings.yearsExp}
                    onChange={e => set('yearsExp', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"
                  />
                </div>
              </>
            )}

            {section === 'classes' && (
              <>
                <p className="text-xs text-slate-400">Manage the classes you teach.</p>
                <div className="space-y-2">
                  {MOCK_CLASSES.map(cls => (
                    <div key={cls.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{cls.name}</p>
                        <p className="text-xs text-slate-400">{cls.count} students</p>
                      </div>
                      <span className="text-xs font-semibold text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
                <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
                  <Plus size={14} /> Add Class
                </button>
              </>
            )}

            {section === 'notifications' && (
              <div className="space-y-1">
                {[
                  { key: 'notifyNewJournal' as const, label: 'New parent journal entry', desc: 'Alert when a parent submits a journal entry' },
                  { key: 'notifyParentMessage' as const, label: 'Parent messages', desc: 'Alert when a parent sends you a message' },
                  { key: 'notifyWeeklySummary' as const, label: 'Weekly class summary', desc: 'Receive a weekly digest every Monday' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between w-full py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={settings[key]}
                      onClick={() => set(key, !settings[key])}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings[key] ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {section === 'language' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-3">Choose the language for your interface and communications.</p>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => set('language', lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left
                      ${settings.language === lang.code ? 'border-blue-300 bg-blue-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className={`text-sm font-semibold ${settings.language === lang.code ? 'text-blue-700' : 'text-slate-700'}`}>{lang.label}</span>
                    {settings.language === lang.code && <span className="ml-auto text-blue-500 text-xs font-bold">✓ Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          {saved && <span className="text-xs text-emerald-500 font-semibold">Saved ✓</span>}
          {!saved && <span />}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
              <Save size={13} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
