'use client'
import { useState, useEffect } from 'react'
import { X, Globe } from 'lucide-react'
import type { Language } from '@/types'
import { useApi } from '@/lib/api'

interface ChildProfile {
  name: string
  age: string
  yearLevel: string
  gender: string
  school: string
  language: Language
}

const DEFAULT_PROFILE: ChildProfile = {
  name: '', age: '', yearLevel: '', gender: '', school: '', language: 'en',
}

const LANGUAGES: { value: Language; flag: string; label: string; native: string }[] = [
  { value: 'en',    flag: '🇬🇧', label: 'English',              native: 'English' },
  { value: 'vi',    flag: '🇻🇳', label: 'Vietnamese',           native: 'Tiếng Việt' },
  { value: 'zh',    flag: '🇨🇳', label: 'Chinese (Simplified)', native: '中文（简体）' },
  { value: 'zh-TW', flag: '🇹🇼', label: 'Chinese (Traditional)',native: '中文（繁體）' },
  { value: 'ar',    flag: '🇸🇦', label: 'Arabic',               native: 'العربية' },
  { value: 'hi',    flag: '🇮🇳', label: 'Hindi',                native: 'हिन्दी' },
  { value: 'es',    flag: '🇪🇸', label: 'Spanish',              native: 'Español' },
  { value: 'fr',    flag: '🇫🇷', label: 'French',               native: 'Français' },
  { value: 'de',    flag: '🇩🇪', label: 'German',               native: 'Deutsch' },
  { value: 'ko',    flag: '🇰🇷', label: 'Korean',               native: '한국어' },
  { value: 'ja',    flag: '🇯🇵', label: 'Japanese',             native: '日本語' },
  { value: 'id',    flag: '🇮🇩', label: 'Indonesian',           native: 'Bahasa Indonesia' },
  { value: 'ms',    flag: '🇲🇾', label: 'Malay',                native: 'Bahasa Melayu' },
  { value: 'th',    flag: '🇹🇭', label: 'Thai',                 native: 'ภาษาไทย' },
  { value: 'tl',    flag: '🇵🇭', label: 'Tagalog',              native: 'Tagalog' },
]

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const api = useApi()
  const [profile, setProfile] = useState<ChildProfile>(DEFAULT_PROFILE)
  const [appLanguage, setAppLanguage] = useState<Language>('en')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    try {
      const raw = localStorage.getItem('userSettings')
      if (raw) {
        const settings = JSON.parse(raw)
        if (settings.childProfile) setProfile({ ...DEFAULT_PROFILE, ...settings.childProfile })
        if (settings.appLanguage) setAppLanguage(settings.appLanguage as Language)
      }
    } catch { /* ignore */ }
  }, [open])

  const handleLanguageSelect = async (lang: Language) => {
    setAppLanguage(lang)
    localStorage.setItem('preferred_language', lang)
    await api.updateLanguage(lang).catch(() => { /* ignore */ })
  }

  const handleSave = () => {
    localStorage.setItem('userSettings', JSON.stringify({
      childProfile: {
        name: profile.name,
        age: profile.age,
        yearLevel: profile.yearLevel,
        gender: profile.gender,
        school: profile.school,
        language: profile.language,
      },
      appLanguage,
    }))
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 2000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative backdrop-blur-xl bg-white/80 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border border-white/60">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* MY CHILD */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">My Child</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Child&apos;s name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Emma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Age</label>
                  <select
                    value={profile.age}
                    onChange={e => setProfile(p => ({ ...p, age: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 bg-white"
                  >
                    <option value="">Select age</option>
                    {Array.from({ length: 14 }, (_, i) => i + 5).map(age => (
                      <option key={age} value={String(age)}>{age}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Year Level</label>
                  <select
                    value={profile.yearLevel}
                    onChange={e => setProfile(p => ({ ...p, yearLevel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 bg-white"
                  >
                    <option value="">Year level</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(yr => (
                      <option key={yr} value={`Year ${yr}`}>Year {yr}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Gender</label>
                <div className="flex gap-2">
                  {['Boy', 'Girl', 'Prefer not to say'].map(g => (
                    <button
                      key={g}
                      onClick={() => setProfile(p => ({ ...p, gender: g }))}
                      className={`flex-1 py-2 px-1 rounded-xl text-xs font-medium border transition-all
                        ${profile.gender === g
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">School</label>
                <input
                  type="text"
                  list="school-names"
                  value={profile.school}
                  onChange={e => setProfile(p => ({ ...p, school: e.target.value }))}
                  placeholder="e.g. Greenwood Primary"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500"
                />
                <datalist id="school-names">
                  <option value="Greenwood Primary" />
                  <option value="Sydney Boys High School" />
                  <option value="Sydney Girls High School" />
                  <option value="North Sydney Boys High School" />
                  <option value="James Ruse Agricultural High School" />
                  <option value="Baulkham Hills High School" />
                  <option value="St George Girls High School" />
                  <option value="Hornsby Girls High School" />
                  <option value="Fort Street High School" />
                </datalist>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Primary language spoken at home</label>
                <select
                  value={profile.language}
                  onChange={e => setProfile(p => ({ ...p, language: e.target.value as Language }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 bg-white"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.flag} {l.native} — {l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* APP LANGUAGE */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Globe size={11} />
              App Language
            </p>
            <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  onClick={() => handleLanguageSelect(l.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all
                    ${appLanguage === l.value
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2.5 font-medium">
                    <span className="text-base">{l.flag}</span>
                    <span>{l.native}</span>
                  </span>
                  <span className={`text-xs ${appLanguage === l.value ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    {appLanguage === l.value ? '✓' : l.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-6 pt-2">
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]
              ${saved
                ? 'bg-emerald-400 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
          >
            {saved ? 'Saved! ✓' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
