export type Role = 'teacher' | 'parent'
export type Language = 'en' | 'vi' | 'zh' | 'zh-TW' | 'ar' | 'hi' | 'es' | 'fr' | 'de' | 'ko' | 'ja' | 'id' | 'ms' | 'th' | 'tl'
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
  date?: string
  week_id?: string
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
