'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { ChatMessage } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

// ---- Real-time Chat Hook ----
export function useChat(roomId: string) {
  const { getToken } = useAuth()
  const ws = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!roomId) return
    let active = true

    const connect = async () => {
      const token = await getToken()
      const socket = new WebSocket(`${WS_URL}/ws/chat/${roomId}?token=${token}`)
      ws.current = socket

      socket.onopen = () => { if (active) setConnected(true) }
      socket.onclose = () => { if (active) setConnected(false) }

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'history') setMessages(data.messages)
        else if (data.type === 'message') setMessages(prev => [...prev, data])
        else if (data.type === 'typing') {
          setIsTyping(true)
          setTimeout(() => setIsTyping(false), 2000)
        }
      }
    }
    connect()
    return () => { active = false; ws.current?.close() }
  }, [roomId])

  const sendMessage = useCallback((content: string) => {
    ws.current?.send(JSON.stringify({ type: 'message', content }))
  }, [])

  const sendTyping = useCallback(() => {
    ws.current?.send(JSON.stringify({ type: 'typing' }))
  }, [])

  return { messages, connected, isTyping, sendMessage, sendTyping }
}

// ---- Chatbot Streaming Hook ----
export function useChatbot(parentId: string) {
  const { getToken } = useAuth()
  const ws = useRef<WebSocket | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  useEffect(() => {
    const effectiveId = parentId || 'guest'
    let active = true

    const connect = async () => {
      const token = await getToken().catch(() => null)
      const socket = new WebSocket(`${WS_URL}/ws/chatbot/${effectiveId}?token=${token ?? ''}`)
      ws.current = socket

      socket.onclose = (e) => {
        if (e.code === 4001) console.warn('Chatbot: auth rejected')
      }

      socket.onmessage = (e) => {
        if (!active) return
        const data = JSON.parse(e.data)
        if (data.type === 'token') {
          setStreamingText(prev => prev + data.token)
        } else if (data.type === 'done') {
          setHistory(prev => [...prev, { role: 'assistant', content: data.full_content }])
          setStreamingText('')
          setIsStreaming(false)
        } else if (data.type === 'error') {
          setIsStreaming(false)
          setStreamingText('')
        }
      }
    }
    connect()
    return () => { active = false; ws.current?.close() }
  }, [parentId])

  const sendMessage = useCallback((content: string, briefId?: string, feature: string = 'homework') => {
    setIsStreaming(true)
    setHistory(prev => [...prev, { role: 'user', content }])
    ws.current?.send(JSON.stringify({ type: 'message', content, brief_id: briefId, feature }))
  }, [])

  return { history, streamingText, isStreaming, sendMessage }
}
