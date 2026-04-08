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

  // ---- Class detail (students + diary entries) ----
  const getClassStudents = async (class_id: string) => {
    const res = await fetch(`${BASE_URL}/api/teacher/classes/${class_id}/students`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const getClassCurriculum = async (class_id: string): Promise<ClassroomCourseData> => {
    const res = await fetch(`${BASE_URL}/api/teacher/classes/${class_id}/curriculum`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const getClassInsights = async (class_id: string) => {
    const res = await fetch(`${BASE_URL}/api/teacher/classes/${class_id}/insights`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  // ---- Parent diary + insights ----
  const getParentDiary = async () => {
    const res = await fetch(`${BASE_URL}/api/parent/diary`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const getParentInsights = async () => {
    const res = await fetch(`${BASE_URL}/api/parent/insights`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const getParentWeeklyDigest = async () => {
    const res = await fetch(`${BASE_URL}/api/parent/weekly-digest`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const getParentBrief = async (date: string, subject: string) => {
    const res = await fetch(`${BASE_URL}/api/parent/briefs?date=${date}&subject=${encodeURIComponent(subject)}`, { headers: await headers() })
    if (!res.ok) throw await res.json()
    return res.json()
  }

  // ---- Google Classroom ----
  const getClassroomCourses = async (): Promise<{ id: string; name: string; section: string; state: string }[]> => {
    const res = await fetch(`${BASE_URL}/api/teacher/classroom/courses`)
    if (!res.ok) throw await res.json()
    return res.json()
  }

  const getClassroomItems = async (courseId: string): Promise<ClassroomCourseData> => {
    const res = await fetch(`${BASE_URL}/api/teacher/classroom/courses/${courseId}/items`)
    if (!res.ok) throw await res.json()
    return res.json()
  }

  return { getClasses, createClass, submitCompose, getTeacherBriefs, getBriefFeedback, getInbox, markRead, submitFeedback, updateLanguage, getProfile, getChatRooms, getClassStudents, getClassCurriculum, getClassInsights, getParentDiary, getParentInsights, getParentWeeklyDigest, getClassroomCourses, getClassroomItems, getParentBrief }
}

// ── Google Classroom types ────────────────────────────────────────────────────
export interface ClassroomStudent {
  student_id: string
  student_name: string
  student_email: string
  state: string
  late: boolean
  assigned_grade: number | null
  draft_grade: number | null
  submitted_at: string | null
}

export interface ClassroomItem {
  id: string
  type: 'material' | 'assignment'
  title: string
  description: string
  state: string
  created_time: string | null
  update_time: string | null
  due_date: string | null
  max_points: number | null
  attachments: { type: string; title: string; url: string }[]
  students: ClassroomStudent[]
  submission_summary: {
    total: number
    turned_in: number
    graded: number
    avg_grade: number | null
  } | null
  week_id?: string
}

export interface ClassroomWeeklyTopic {
  week: number
  week_id: string
  week_name: string
  subject: string
  topic: string
  learningGoal: string
  class_work?: string
}

export interface ClassroomCourseData {
  course_id: string
  student_count: number
  materials: ClassroomItem[]
  assignments: ClassroomItem[]
  items: ClassroomItem[]
  weekly_topics?: ClassroomWeeklyTopic[]
}
