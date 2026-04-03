# Frontend — Next.js TypeScript

Read CLAUDE.md and API.md first.
Package manager: pnpm (always, never npm or yarn).

---

## Setup

```bash
cd frontend
pnpm install
pnpm dev
```

## Install dependencies
```bash
pnpm add @clerk/nextjs @supabase/supabase-js
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add lucide-react class-variance-authority clsx tailwind-merge
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card badge textarea select toast
```

---

## File: frontend/src/middleware.ts
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isTeacherRoute = createRouteMatcher(['/teacher(.*)'])
const isParentRoute = createRouteMatcher(['/parent(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect teacher and parent routes — redirect to sign-in if not logged in
  if (isTeacherRoute(req) || isParentRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

---

## File: frontend/src/app/layout.tsx
```typescript
import { ClerkProvider, Show, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <header className="border-b px-6 py-3 flex items-center justify-between">
            <span className="font-semibold text-lg">Srenniw</span>
            <div className="flex gap-3 items-center">
              <Show when="signed-out">
                <SignInButton><button className="text-sm px-4 py-2 border rounded-md">Sign in</button></SignInButton>
                <SignUpButton><button className="text-sm px-4 py-2 bg-black text-white rounded-md">Sign up</button></SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          <main>{children}</main>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

---

## File: frontend/src/app/page.tsx — Landing + Role Redirect
```typescript
'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) return
    const role = user.publicMetadata?.role as string
    if (role === 'teacher') router.push('/teacher/dashboard')
    else if (role === 'parent') router.push('/parent/inbox')
    // If no role set yet, stay on landing to pick role
  }, [user, isLoaded, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold text-center">Connecting Home and School</h1>
      <p className="text-gray-500 text-center max-w-md">
        Bridging communication between teachers and parents through AI.
      </p>
      {/* Role selection shown only to signed-in users with no role */}
      <div className="flex gap-4 mt-4">
        <a href="/teacher/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
          I'm a Teacher
        </a>
        <a href="/parent/inbox" className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium">
          I'm a Parent
        </a>
      </div>
    </div>
  )
}
```

---

## File: frontend/src/types/index.ts — Shared TypeScript types
```typescript
export type Role = 'teacher' | 'parent'
export type Language = 'en' | 'vi' | 'zh' | 'ar'
export type ContentType = 'assignment' | 'comment' | 'weekly_update'
export type BriefStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface Brief {
  id: string
  content_type: ContentType
  raw_input: string
  processed_en?: string
  at_home_activities?: Activity[]
  curriculum_notes?: string
  subject?: string
  year_level?: string
  status: BriefStatus
  created_at: string
  published_at?: string
}

export interface Activity {
  title: string
  description: string
  duration_mins: number
}

export interface Notification {
  notification_id: string
  is_read: boolean
  created_at: string
  brief: Brief & { content?: string }
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  sender_role: Role
  content: string
  created_at: string
}

export interface ChatRoom {
  room_id: string
  teacher_clerk_id?: string
  parent_clerk_id?: string
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

export interface ComposeInput {
  class_id: string
  content_type: ContentType
  raw_input: string
  subject: string
  year_level: string
}
```

---

## File: frontend/src/lib/api.ts — Typed API client
```typescript
import { useAuth } from '@clerk/nextjs'
import type { Brief, Notification, ChatRoom, ComposeInput } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export function useApi() {
  const { getToken } = useAuth()

  const headers = async () => ({
    'Authorization': `Bearer ${await getToken()}`,
    'Content-Type': 'application/json'
  })

  // ---- Teacher ----
  const getClasses = async () => {
    const res = await fetch(`${BASE_URL}/api/teacher/classes`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const submitCompose = async (body: ComposeInput): Promise<{ brief_id: string; status: string }> => {
    const res = await fetch(`${BASE_URL}/api/teacher/compose`, {
      method: 'POST', headers: await headers(), body: JSON.stringify(body)
    })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const getTeacherBriefs = async (class_id?: string): Promise<Brief[]> => {
    const url = class_id
      ? `${BASE_URL}/api/teacher/briefs?class_id=${class_id}`
      : `${BASE_URL}/api/teacher/briefs`
    const res = await fetch(url, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const getBriefFeedback = async (brief_id: string) => {
    const res = await fetch(`${BASE_URL}/api/teacher/briefs/${brief_id}/feedback`, { headers: await headers() })
    return res.json()
  }

  // ---- Parent ----
  const getInbox = async (): Promise<{ unread_count: number; items: Notification[] }> => {
    const res = await fetch(`${BASE_URL}/api/parent/inbox`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const markRead = async (notification_id: string) => {
    await fetch(`${BASE_URL}/api/parent/inbox/${notification_id}/read`, {
      method: 'PATCH', headers: await headers()
    })
  }

  const submitFeedback = async (brief_id: string, message: string) => {
    const res = await fetch(`${BASE_URL}/api/parent/feedback`, {
      method: 'POST', headers: await headers(),
      body: JSON.stringify({ brief_id, message })
    })
    return res.json()
  }

  const updateLanguage = async (lang: string) => {
    await fetch(`${BASE_URL}/api/parent/profile`, {
      method: 'PATCH', headers: await headers(),
      body: JSON.stringify({ preferred_language: lang })
    })
  }

  // ---- Chat rooms (shared) ----
  const getChatRooms = async (role: 'teacher' | 'parent'): Promise<ChatRoom[]> => {
    const res = await fetch(`${BASE_URL}/api/${role}/chat-rooms`, { headers: await headers() })
    return res.json()
  }

  return { getClasses, submitCompose, getTeacherBriefs, getBriefFeedback, getInbox, markRead, submitFeedback, updateLanguage, getChatRooms }
}
```

---

## File: frontend/src/lib/websocket.ts — WebSocket hooks
```typescript
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

  return { messages, connected, sendMessage, sendTyping }
}

// ---- Chatbot Streaming Hook ----
export function useChatbot(parentId: string) {
  const { getToken } = useAuth()
  const ws = useRef<WebSocket | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  useEffect(() => {
    if (!parentId) return
    let active = true

    const connect = async () => {
      const token = await getToken()
      const socket = new WebSocket(`${WS_URL}/ws/chatbot/${parentId}?token=${token}`)
      ws.current = socket

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

  const sendMessage = useCallback((content: string, briefId?: string) => {
    setIsStreaming(true)
    setHistory(prev => [...prev, { role: 'user', content }])
    ws.current?.send(JSON.stringify({ type: 'message', content, brief_id: briefId }))
  }, [])

  return { history, streamingText, isStreaming, sendMessage }
}
```

---

## Pages to Build

### Teacher pages

**`/teacher/layout.tsx`** — sidebar nav with: Dashboard, Compose, Chat

**`/teacher/dashboard/page.tsx`** — show list of briefs with status badges (pending/processing/done). Use `getTeacherBriefs()`. Show feedback counts. Use Supabase Realtime to update status live.

**`/teacher/compose/page.tsx`** — form with:
- Dropdown: Class, Content Type (assignment/comment/weekly_update), Subject, Year Level
- Large textarea: "Write your message to parents"
- Submit button → calls `submitCompose()` → shows success with brief_id
- Below textarea: display processed brief preview when status=done (poll or Realtime)

**`/teacher/chat/page.tsx`** — left panel: list of chat rooms from `getChatRooms('teacher')`. Right panel: chat window using `useChat(roomId)`. Show message history, input box, send button. Show typing indicator.

### Parent pages

**`/parent/layout.tsx`** — bottom nav (mobile-first): Inbox, Chat, Ask AI. Language selector top-right.

**`/parent/inbox/page.tsx`** — notification list from `getInbox()`. Each item:
- Shows content in parent's language (content field from API)
- Shows at_home_activities as cards with duration badge
- Shows "Reply" button → opens feedback textarea → calls `submitFeedback()`
- Mark as read on open using `markRead()`
- Supabase Realtime: subscribe to notifications table to show new items live

**`/parent/chatbot/page.tsx`** — full-screen chat UI using `useChatbot(parentId)`. Show message history. As streaming tokens arrive, show them with a blinking cursor effect. Input at bottom. Add suggestion chips: "What does this mean?", "Give me more activities", "Explain in simpler terms".

**`/parent/chat/page.tsx`** — same structure as teacher chat but uses `getChatRooms('parent')`.

---

## Key UI Requirements
- Parent portal: mobile-first design, large fonts, high contrast
- All text content: render `content` field from API (already in parent's language)
- Loading states: skeleton cards while fetching
- Error states: toast notifications on API failures
- Realtime badge: show unread count on inbox tab icon
