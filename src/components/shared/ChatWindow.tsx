'use client'
import { useEffect, useRef, useState } from 'react'
import ChatBubble from './ChatBubble'
import type { ChatMessage } from '@/types'

interface Props {
  messages: ChatMessage[]
  onSend: (content: string) => void
  onTyping?: () => void
  currentUserId: string
  connected: boolean
  isTyping?: boolean
}

export default function ChatWindow({ messages, onSend, onTyping, currentUserId, connected, isTyping }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    const text = input.trim()
    if (!text || !connected) return
    onSend(text)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else {
      onTyping?.()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="px-4 py-2.5 border-b border-[#eeeeee] flex items-center gap-2 bg-white">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-[#ddd]'}`} />
        <span className="text-xs text-[#999]">{connected ? 'Connected' : 'Connecting…'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f7f8fc]">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[#bbb] mt-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} currentUserId={currentUserId} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-[#eeeeee] rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="text-sm text-[#999] animate-pulse">Typing…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#eeeeee] p-4 flex gap-3 bg-white">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 border border-[#eeeeee] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#446dd5] bg-white text-[#333]"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          className="px-4 py-2 bg-[#446dd5] text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-[#315bcf] transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
