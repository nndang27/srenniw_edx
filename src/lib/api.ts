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

  const createClass = async (body: { name: string; year_level: string; subject: string }) => {
    const res = await fetch(`${BASE_URL}/api/teacher/classes`, {
      method: 'POST', headers: await headers(), body: JSON.stringify(body)
    })
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

  const getProfile = async () => {
    const res = await fetch(`${BASE_URL}/api/parent/profile`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  // ---- Chat rooms (shared) ----
  const getChatRooms = async (role: 'teacher' | 'parent'): Promise<ChatRoom[]> => {
    const res = await fetch(`${BASE_URL}/api/${role}/chat-rooms`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  return { getClasses, createClass, submitCompose, getTeacherBriefs, getBriefFeedback, getInbox, markRead, submitFeedback, updateLanguage, getProfile, getChatRooms }
}
