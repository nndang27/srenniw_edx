# API Contracts — REST + WebSocket

Read CLAUDE.md first. All REST routes go through FastAPI (port 8000).
All requests must include `Authorization: Bearer <clerk_jwt>` header.

---

## Authentication Rules
- Every endpoint verifies Clerk JWT in `auth.py`
- Role is read from `payload["role"]` inside JWT
- Teacher endpoints → 403 if role != "teacher"
- Parent endpoints → 403 if role != "parent"
- WebSocket → token sent as query param: `?token=<clerk_jwt>`

---

## REST Endpoints

### Health check
```
GET /health
Response: { "status": "ok", "version": "1.0.0" }
No auth required.
```

---

### TEACHER endpoints (role = "teacher")

#### Get teacher's classes
```
GET /api/teacher/classes
Response 200:
[
  {
    "id": "uuid",
    "name": "4B - Mathematics",
    "year_level": "Year 4",
    "subject": "Mathematics",
    "parent_count": 22
  }
]
```

#### Create a class
```
POST /api/teacher/classes
Body: {
  "name": "4B - Mathematics",
  "year_level": "Year 4",
  "subject": "Mathematics"
}
Response 201: { "id": "uuid", ...class fields }
```

#### Submit content (assignment / comment / update)
```
POST /api/teacher/compose
Body: {
  "class_id": "uuid",
  "content_type": "assignment" | "comment" | "weekly_update",
  "raw_input": "This week students are learning to add fractions...",
  "subject": "Mathematics",
  "year_level": "Year 4"
}
Response 202: {
  "brief_id": "uuid",
  "status": "pending",
  "message": "Content submitted. Agent is processing."
}
-- Agent runs async. Teacher polls or uses Supabase Realtime to watch status.
```

#### Get all briefs for teacher
```
GET /api/teacher/briefs?class_id=uuid&limit=20&offset=0
Response 200:
[
  {
    "id": "uuid",
    "content_type": "assignment",
    "raw_input": "...",
    "processed_en": "...",
    "status": "done",
    "created_at": "ISO8601",
    "published_at": "ISO8601",
    "feedback_count": 3,
    "notification_count": 22
  }
]
```

#### Get feedback summary for a brief
```
GET /api/teacher/briefs/{brief_id}/feedback
Response 200:
{
  "brief_id": "uuid",
  "total_feedback": 5,
  "messages": [
    {
      "id": "uuid",
      "message": "My son struggled with part 2",
      "created_at": "ISO8601"
    }
  ]
}
```

#### Get teacher's chat rooms (list of parents they're chatting with)
```
GET /api/teacher/chat-rooms
Response 200:
[
  {
    "room_id": "uuid",
    "parent_clerk_id": "user_xxx",
    "parent_name": "Nguyen Van A",   -- from Clerk metadata
    "last_message": "Thank you!",
    "last_message_at": "ISO8601",
    "unread_count": 2
  }
]
```

---

### PARENT endpoints (role = "parent")

#### Get parent profile (language pref, class info)
```
GET /api/parent/profile
Response 200:
{
  "parent_clerk_id": "user_xxx",
  "preferred_language": "vi",
  "child_name": "Nguyen Van B",
  "classes": [
    { "id": "uuid", "name": "4B - Mathematics", "teacher_name": "Ms Smith" }
  ]
}
```

#### Update language preference
```
PATCH /api/parent/profile
Body: { "preferred_language": "vi" | "zh" | "ar" | "en" }
Response 200: { "preferred_language": "vi" }
```

#### Get inbox (notifications)
```
GET /api/parent/inbox?limit=20&offset=0
Response 200:
{
  "unread_count": 3,
  "items": [
    {
      "notification_id": "uuid",
      "is_read": false,
      "created_at": "ISO8601",
      "brief": {
        "id": "uuid",
        "content_type": "assignment",
        "subject": "Mathematics",
        -- content is auto-selected by parent's preferred_language
        "content": "Tuần này con đang học...",
        "at_home_activities": [
          { "title": "Pizza phân số", "description": "...", "duration_mins": 10 }
        ],
        "published_at": "ISO8601"
      }
    }
  ]
}
```

#### Mark notification as read
```
PATCH /api/parent/inbox/{notification_id}/read
Response 200: { "is_read": true }
```

#### Submit feedback on a brief
```
POST /api/parent/feedback
Body: {
  "brief_id": "uuid",
  "message": "Con làm được bài 1 nhưng chưa hiểu bài 2"
}
Response 201: { "id": "uuid", "created_at": "ISO8601" }
```

#### Get parent's chat rooms
```
GET /api/parent/chat-rooms
Response 200:
[
  {
    "room_id": "uuid",
    "teacher_name": "Ms Smith",
    "last_message": "Great work!",
    "last_message_at": "ISO8601",
    "unread_count": 0
  }
]
```

---

## WebSocket Endpoints

### 1. Real-time Chat — Teacher ↔ Parent
```
WS /ws/chat/{room_id}?token=<clerk_jwt>

-- Connect: verify token, join room
-- Both teacher and parent connect to same room_id

-- Client sends:
{ "type": "message", "content": "Hello, how is my child doing?" }

-- Server broadcasts to both:
{
  "type": "message",
  "message_id": "uuid",
  "sender_id": "user_xxx",
  "sender_role": "parent",
  "content": "Hello, how is my child doing?",
  "created_at": "ISO8601"
}

-- On connect, server also sends last 30 messages:
{ "type": "history", "messages": [...] }

-- Typing indicator:
Client sends:  { "type": "typing" }
Server sends:  { "type": "typing", "sender_id": "user_xxx" }
```

### 2. AI Chatbot (Streaming) — Parent only
```
WS /ws/chatbot/{parent_id}?token=<clerk_jwt>

-- Client sends:
{
  "type": "message",
  "content": "What does mẫu số mean and how can I explain it to my child?",
  "brief_id": "uuid"        -- optional: for context-aware answers
}

-- Server streams tokens:
{ "type": "token", "token": "The" }
{ "type": "token", "token": " denominator" }
{ "type": "token", "token": " is..." }
...
{ "type": "done", "full_content": "The denominator is the bottom number..." }

-- On error:
{ "type": "error", "message": "Agent unavailable" }
```

---

## Error Response Format (all endpoints)
```json
{
  "error": {
    "code": "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "AGENT_ERROR",
    "message": "Human readable message"
  }
}
```

---

## Frontend API Client (TypeScript)
Claude must create `frontend/src/lib/api.ts` implementing all these endpoints as typed functions.
Use `getToken()` from Clerk's `useAuth()` hook for every request.
Base URL from `NEXT_PUBLIC_BACKEND_URL` env var.

Example pattern:
```typescript
const submitCompose = async (body: ComposeInput): Promise<BriefResponse> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/api/teacher/compose`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
```
