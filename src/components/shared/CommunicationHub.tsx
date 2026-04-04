'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Sparkles, User, GraduationCap } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useApi } from '@/lib/api'
import { useChatbot, useChat } from '@/lib/websocket'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function CommunicationHub() {
  const { user } = useUser()
  const api = useApi()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai' | 'teacher'>('ai')
  const [aiInput, setAiInput] = useState('')
  const [teacherInput, setTeacherInput] = useState('')
  const [roomId, setRoomId] = useState('')
  const bottomAiRef = useRef<HTMLDivElement>(null)
  const bottomTeacherRef = useRef<HTMLDivElement>(null)

  const parentId = user?.id || ''
  const { history, streamingText, isStreaming, sendMessage: sendAiMessage } = useChatbot(parentId)
  const { messages: chatMessages, sendMessage: sendChatMessage } = useChat(roomId)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    api.getChatRooms('parent')
      .then(rooms => {
        if (rooms.length > 0) setRoomId((rooms[0] as any).room_id || (rooms[0] as any).id || '')
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    bottomAiRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingText])

  useEffect(() => {
    bottomTeacherRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim() || isStreaming) return
    sendAiMessage(aiInput.trim())
    setAiInput('')
  }

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherInput.trim()) return
    sendChatMessage(teacherInput.trim())
    setTeacherInput('')
  }

  const handleChipClick = (chip: string) => {
    if (!isStreaming) sendAiMessage(chip)
  }

  const CHIPS = ['What does this mean?', 'Give me easier activities', 'Explain in Vietnamese', 'Why is this important?']

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        data-testid="fab-communication"
        className={`fixed ${isMobile ? 'bottom-20 right-4' : 'bottom-8 right-8'} w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-xl z-40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div className={`fixed top-0 right-0 h-[100dvh] w-full sm:w-[400px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-lg text-slate-800">Communication Hub</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors" data-testid="button-close-hub">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-4">
          <div className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles className="w-4 h-4" />
              Ask AI
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${activeTab === 'teacher' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <GraduationCap className="w-4 h-4" />
              Teacher Chat
            </button>
          </div>
        </div>

        {/* AI Chat Tab */}
        {activeTab === 'ai' && (
          <>
            <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100 mt-4">
              <p className="text-xs text-blue-800 text-center font-medium">
                CurricuLLM knows exactly what your child is learning. Ask for tips or explanations!
              </p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {history.length === 0 && !streamingText && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-3 text-sm text-slate-700">
                      Hi! I&apos;m your AI curriculum assistant. Ask me anything about what your child is learning!
                    </div>
                  </div>
                )}
                {history.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-blue-50'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-slate-500" /> : <Sparkles className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className={`rounded-2xl p-3 text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-700 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {streamingText && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-3 text-sm text-slate-700 max-w-[80%]">
                      {streamingText}
                      <span className="inline-block w-0.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse align-middle rounded" />
                    </div>
                  </div>
                )}
                {/* Suggestion chips */}
                {history.length === 0 && !isStreaming && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CHIPS.map(chip => (
                      <button
                        key={chip}
                        onClick={() => handleChipClick(chip)}
                        className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomAiRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-slate-100 bg-white">
              <form onSubmit={handleAiSubmit} className="flex gap-2">
                <Input
                  placeholder="Ask CurricuLLM..."
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  className="rounded-full bg-slate-50 border-slate-200"
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isStreaming}
                  className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}

        {/* Teacher Chat Tab */}
        {activeTab === 'teacher' && (
          <>
            <div className="px-4 py-3 flex items-center gap-3 bg-white border-b border-slate-100 mt-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold shrink-0">
                T
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Your Teacher</h3>
                <p className="text-xs text-slate-500">Typically replies within 24h</p>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No messages yet. Start the conversation!</p>
                )}
                {chatMessages.map((msg, i) => {
                  const isMe = msg.sender_role === 'parent'
                  return (
                    <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-slate-200' : 'bg-blue-50'}`}>
                        {isMe ? <User className="w-4 h-4 text-slate-500" /> : <span className="text-xs font-bold text-blue-500">T</span>}
                      </div>
                      <div className={`rounded-2xl p-3 text-sm max-w-[80%] ${isMe ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-700 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomTeacherRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-slate-100 bg-white">
              <form onSubmit={handleTeacherSubmit} className="flex gap-2">
                <Input
                  placeholder="Message your teacher..."
                  value={teacherInput}
                  onChange={e => setTeacherInput(e.target.value)}
                  className="rounded-full bg-slate-50 border-slate-200"
                />
                <button
                  type="submit"
                  disabled={!teacherInput.trim()}
                  className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  )
}
