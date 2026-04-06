'use client'
import { useState } from 'react'
import { MessageCircle, X, Send, ChevronLeft } from 'lucide-react'

interface MockConversation {
  id: string
  parentName: string
  studentName: string
  avatar: string
  lastMessage: string
  lastTime: string
  unread: boolean
}

interface MockMessage {
  id: number
  from: 'teacher' | 'parent'
  text: string
  time: string
}

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'c1',
    parentName: 'Sarah Watson',
    studentName: 'Emily Watson',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=sarah',
    lastMessage: 'Thank you for the update! Emily has been working hard.',
    lastTime: '10:24 AM',
    unread: true,
  },
  {
    id: 'c2',
    parentName: "Michael O'Brien",
    studentName: "James O'Brien",
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=michael',
    lastMessage: 'Could we schedule a call this week?',
    lastTime: 'Yesterday',
    unread: true,
  },
  {
    id: 'c3',
    parentName: 'Linh Nguyen',
    studentName: 'Sophie Nguyen',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=linh',
    lastMessage: 'Sophie loved the science experiment!',
    lastTime: 'Mon',
    unread: false,
  },
  {
    id: 'c4',
    parentName: 'David Chen',
    studentName: 'Lucas Chen',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=david',
    lastMessage: 'Will Lucas need extra materials for art?',
    lastTime: 'Mon',
    unread: false,
  },
]

const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  c1: [
    { id: 1, from: 'teacher', text: "Hi Sarah! Just wanted to update you on Emily's progress this week. She's been doing wonderfully in Maths.", time: '10:20 AM' },
    { id: 2, from: 'parent', text: "Thank you for the update! Emily has been working hard. She's been practicing at home too.", time: '10:24 AM' },
  ],
  c2: [
    { id: 1, from: 'parent', text: "Could we schedule a call this week to discuss James's reading progress?", time: 'Yesterday' },
    { id: 2, from: 'teacher', text: "Of course! I have availability Thursday afternoon or Friday morning. What works for you?", time: 'Yesterday' },
  ],
  c3: [
    { id: 1, from: 'parent', text: "Sophie loved the science experiment! She recreated it at home.", time: 'Mon' },
    { id: 2, from: 'teacher', text: "That's wonderful to hear! Her curiosity in class is infectious.", time: 'Mon' },
  ],
  c4: [
    { id: 1, from: 'parent', text: "Will Lucas need extra materials for the art project next week?", time: 'Mon' },
  ],
}

export default function TeacherChatBubble() {
  const [open, setOpen] = useState(false)
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [convs, setConvs] = useState(MOCK_CONVERSATIONS)

  const unreadCount = convs.filter(c => c.unread).length

  const handleOpenConv = (id: string) => {
    setActiveConv(id)
    setConvs(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c))
  }

  const handleSend = () => {
    if (!draft.trim() || !activeConv) return
    const newMsg: MockMessage = { id: Date.now(), from: 'teacher', text: draft.trim(), time: 'Just now' }
    setMessages(prev => ({ ...prev, [activeConv]: [...(prev[activeConv] ?? []), newMsg] }))
    setConvs(prev => prev.map(c => c.id === activeConv ? { ...c, lastMessage: draft.trim(), lastTime: 'Just now' } : c))
    setDraft('')
  }

  const activeData = convs.find(c => c.id === activeConv)
  const activeMessages = activeConv ? (messages[activeConv] ?? []) : []

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-white ring-2 ring-blue-400 shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Open parent chat"
      >
        <MessageCircle size={24} className="text-blue-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-80 h-[480px] bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            {activeConv ? (
              <>
                <button onClick={() => setActiveConv(null)} className="flex items-center gap-1.5 text-blue-500 text-sm font-semibold">
                  <ChevronLeft size={16} /> Back
                </button>
                <span className="text-sm font-bold text-slate-800 truncate">{activeData?.parentName}</span>
                <div className="w-16" />
              </>
            ) : (
              <>
                <span className="font-bold text-slate-800 text-sm">Parent Messages</span>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
              </>
            )}
          </div>

          {!activeConv ? (
            /* Conversation list */
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {convs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleOpenConv(conv.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={conv.avatar} alt={conv.parentName} className="w-10 h-10 rounded-full bg-blue-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-semibold truncate ${conv.unread ? 'text-slate-900' : 'text-slate-700'}`}>{conv.parentName}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">{conv.lastTime}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{conv.studentName}&apos;s parent</p>
                    <p className={`text-xs truncate mt-0.5 ${conv.unread ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{conv.lastMessage}</p>
                  </div>
                  {conv.unread && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />}
                </button>
              ))}
            </div>
          ) : (
            /* Chat view */
            <>
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden px-4 py-3 space-y-3">
                {activeMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.from === 'teacher' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'}`}>
                      {msg.text}
                      <p className={`text-[10px] mt-0.5 ${msg.from === 'teacher' ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 pb-3 pt-2 border-t border-slate-100 flex items-center gap-2 shrink-0">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-300"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
