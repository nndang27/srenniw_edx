'use client'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useChatbot } from '@/lib/websocket'
import { Bot, User, BookOpen, ChevronDown, ChevronUp, Send, MessageCircle } from 'lucide-react'

// ── Homework context (mirrors backend sample data) ──────────────────────────
const HOMEWORK_CONTEXT = {
  week: 'Week 15',
  yearLevel: 'Year 4',
  class: '4B — Mrs Johnson',
  assignments: [
    { subject: 'Maths',    topic: 'Multiplication & Division',  due: 'Friday',          emoji: '🔢' },
    { subject: 'English',  topic: 'Persuasive Writing',          due: 'Thursday',        emoji: '📝' },
    { subject: 'Science',  topic: 'States of Matter',            due: 'Wednesday',       emoji: '🧪' },
    { subject: 'HSIE',     topic: 'Australian Communities',      due: 'Monday (next)',   emoji: '🌏' },
  ],
}

const SUGGESTION_CHIPS = [
  { label: '📐 Explain the area model', category: 'homework' },
  { label: '😰 My child hates school', category: 'wellbeing' },
  { label: '🗓️ Best homework routine?', category: 'schedule' },
  { label: '📚 What homework is due?', category: 'homework' },
  { label: '🍎 Foods that help concentration', category: 'health' },
  { label: '💬 Questions to ask after school', category: 'parenting' },
  { label: '😴 How much sleep does Year 4 need?', category: 'health' },
  { label: '🧠 My child says they\'re stupid', category: 'wellbeing' },
]

// ── Homework context panel ───────────────────────────────────────────────────
function HomeworkPanel({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#eeeeee] bg-[#f7f9ff]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#eef2ff] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-[#446dd5]" />
          <span className="text-xs font-semibold text-[#446dd5]">
            {HOMEWORK_CONTEXT.week} · {HOMEWORK_CONTEXT.class}
          </span>
        </div>
        {collapsed
          ? <ChevronDown size={14} className="text-[#999]" />
          : <ChevronUp size={14} className="text-[#999]" />
        }
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-1.5">
          {HOMEWORK_CONTEXT.assignments.map(a => (
            <div key={a.subject} className="bg-white border border-[#e8eef8] rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{a.emoji}</span>
                <span className="text-[11px] font-bold text-[#333]">{a.subject}</span>
              </div>
              <p className="text-[10px] text-[#666] leading-tight">{a.topic}</p>
              <p className="text-[10px] text-[#999] mt-0.5">Due: {a.due}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Message renderer with markdown-lite support ──────────────────────────────
function MessageBubble({ content, role }: { content: string; role: 'user' | 'assistant' }) {
  // Detect teacher redirect message and style it differently
  const isTeacherRedirect = content.toLowerCase().includes('chat tab') ||
    content.toLowerCase().includes('message the teacher')

  if (isTeacherRedirect && role === 'assistant') {
    return (
      <div className="flex gap-2.5 justify-start">
        <div className="w-7 h-7 bg-[#eef2ff] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={13} className="text-[#446dd5]" />
        </div>
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm bg-[#fff8e1] border border-[#ffd54f] text-sm leading-relaxed text-[#555]">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageCircle size={13} className="text-[#f59e0b]" />
            <span className="text-xs font-bold text-[#b45309]">Tip: Message the teacher</span>
          </div>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-2.5 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <div className="w-7 h-7 bg-[#eef2ff] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={13} className="text-[#446dd5]" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          role === 'user'
            ? 'bg-[#446dd5] text-white rounded-br-sm'
            : 'bg-[#f7f8fc] text-[#333] rounded-bl-sm border border-[#eeeeee]'
        }`}
      >
        {content}
      </div>
      {role === 'user' && (
        <div className="w-7 h-7 bg-[#f7f8fc] border border-[#eeeeee] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <User size={13} className="text-[#666]" />
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const { user } = useUser()
  const { history, streamingText, isStreaming, sendMessage } = useChatbot(user?.id || '')
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingText])

  const handleSend = (text?: string) => {
    const msg = text ?? inputRef.current?.value.trim()
    if (!msg || isStreaming) return
    sendMessage(msg, undefined, 'homework')
    if (!text && inputRef.current) inputRef.current.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#eeeeee] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#eef2ff] rounded-xl flex items-center justify-center">
            <Bot size={18} className="text-[#446dd5]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#333]">Learning Companion</p>
            <p className="text-xs text-[#999]">Homework · Wellbeing · Routines · Parenting tips</p>
          </div>
        </div>
      </div>

      {/* Homework context panel */}
      <HomeworkPanel collapsed={panelCollapsed} onToggle={() => setPanelCollapsed(c => !c)} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {history.length === 0 && !streamingText && (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-[#eef2ff] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bot size={24} className="text-[#446dd5]" />
            </div>
            <p className="text-sm font-semibold text-[#333] mb-1">Hi! I&apos;m your Learning Companion.</p>
            <p className="text-xs text-[#999] max-w-xs mx-auto leading-relaxed">
              Ask me anything — homework help, child wellbeing, study routines, parenting tips, and more.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center max-w-sm mx-auto">
              {SUGGESTION_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => handleSend(chip.label)}
                  className="text-xs font-medium px-3 py-1.5 border border-[#c3d3fb] text-[#446dd5] rounded-full hover:bg-[#eef2ff] transition-colors bg-white"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <MessageBubble key={i} content={msg.content} role={msg.role} />
        ))}

        {streamingText && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 bg-[#eef2ff] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={13} className="text-[#446dd5]" />
            </div>
            <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-[#f7f8fc] text-sm leading-relaxed text-[#333] border border-[#eeeeee] whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-0.5 h-3.5 bg-[#446dd5] ml-0.5 animate-pulse align-middle rounded" />
            </div>
          </div>
        )}

        {isStreaming && !streamingText && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 bg-[#eef2ff] rounded-lg flex items-center justify-center shrink-0">
              <Bot size={13} className="text-[#446dd5]" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#f7f8fc] border border-[#eeeeee] flex gap-1 items-center">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 bg-[#446dd5] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#eeeeee] p-4 flex gap-3 bg-white">
        <textarea
          ref={inputRef}
          onKeyDown={handleKeyDown}
          placeholder="Ask about tonight's homework…"
          rows={1}
          disabled={isStreaming}
          className="flex-1 border border-[#eeeeee] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#446dd5] disabled:bg-[#f7f8fc] bg-white text-[#333]"
        />
        <button
          onClick={() => handleSend()}
          disabled={isStreaming}
          className="w-10 h-10 bg-[#446dd5] text-white rounded-xl disabled:opacity-40 hover:bg-[#315bcf] transition-colors flex items-center justify-center shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
