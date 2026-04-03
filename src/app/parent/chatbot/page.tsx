'use client'
import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useChatbot } from '@/lib/websocket'
import { Bot, User, Sparkles } from 'lucide-react'

const SUGGESTION_CHIPS = [
  'What does this mean?',
  'Give me more activities',
  'Explain in simpler terms',
]

export default function ChatbotPage() {
  const { user } = useUser()
  const { history, streamingText, isStreaming, sendMessage } = useChatbot(user?.id || '')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingText])

  const handleSend = () => {
    const text = inputRef.current?.value.trim()
    if (!text || isStreaming) return
    sendMessage(text)
    if (inputRef.current) inputRef.current.value = ''
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
            <Sparkles size={16} className="text-[#446dd5]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#333]">AI Curriculum Assistant</p>
            <p className="text-xs text-[#999]">Ask me anything about your child's learning</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {history.length === 0 && !streamingText && (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-[#eef2ff] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bot size={24} className="text-[#446dd5]" />
            </div>
            <p className="text-sm font-semibold text-[#333] mb-1">Hi! I'm your AI assistant.</p>
            <p className="text-xs text-[#999] max-w-xs mx-auto">
              Ask me about the curriculum, at-home activities, or anything from your child's school updates.
            </p>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-[#eef2ff] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} className="text-[#446dd5]" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#446dd5] text-white rounded-br-sm'
                  : 'bg-[#f7f8fc] text-[#333] rounded-bl-sm border border-[#eeeeee]'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 bg-[#f7f8fc] border border-[#eeeeee] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-[#666]" />
              </div>
            )}
          </div>
        ))}

        {streamingText && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 bg-[#eef2ff] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={13} className="text-[#446dd5]" />
            </div>
            <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-[#f7f8fc] text-sm leading-relaxed text-[#333] border border-[#eeeeee]">
              {streamingText}
              <span className="inline-block w-0.5 h-3.5 bg-[#446dd5] ml-0.5 animate-pulse align-middle rounded" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {history.length === 0 && !isStreaming && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {SUGGESTION_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => { if (!isStreaming) sendMessage(chip) }}
              className="text-xs font-medium px-3 py-1.5 border border-[#c3d3fb] text-[#446dd5] rounded-full hover:bg-[#eef2ff] transition-colors bg-white"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#eeeeee] p-4 flex gap-3 bg-white">
        <textarea
          ref={inputRef}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the curriculum…"
          rows={1}
          disabled={isStreaming}
          className="flex-1 border border-[#eeeeee] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#446dd5] disabled:bg-[#f7f8fc] bg-white text-[#333]"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming}
          className="px-4 py-2 bg-[#446dd5] text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-[#315bcf] transition-colors"
        >
          {isStreaming ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
