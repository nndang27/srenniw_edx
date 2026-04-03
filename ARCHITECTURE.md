# Architecture Overview

Read CLAUDE.md first.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │  Teacher Portal  │         │      Parent Portal        │  │
│  │                  │         │                           │  │
│  │ • Compose        │         │ • Inbox (notifications)   │  │
│  │ • Dashboard      │         │ • Chatbot (streaming)     │  │
│  │ • Chat           │         │ • Chat (real-time)        │  │
│  └────────┬─────────┘         └────────────┬──────────────┘  │
│           │                                │                 │
│           └───────── Clerk Auth ───────────┘                 │
│                      (role = teacher|parent)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
               REST API + WebSocket (port 8000)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     BACKEND (FastAPI)                        │
│                                                              │
│  /api/teacher/*        → teacher.py router                  │
│  /api/parent/*         → parent.py router                   │
│  /ws/chat/{room_id}    → chat.py (WebSocket)                │
│  /ws/chatbot/{id}      → chatbot.py (WebSocket + stream)    │
│                                                              │
│  auth.py: verifies Clerk JWT on every request               │
└────────┬────────────────────────────┬───────────────────────┘
         │                            │
         ▼                            ▼
┌─────────────────┐         ┌──────────────────────┐
│    Supabase     │         │    Agent Pipeline     │
│  (PostgreSQL)   │         │    (agent/pipeline.py)│
│                 │         │                       │
│ • classes       │         │  MOCK (swap later):   │
│ • class_parents │◄────────│  1. Call CurricuLLM   │
│ • briefs        │         │  2. Function calling  │
│ • translations  │         │  3. Translate         │
│ • notifications │         │  4. Save to Supabase  │
│ • feedback      │         │  5. Send notifications│
│ • chat_rooms    │         │                       │
│ • chat_messages │         │  Streaming chatbot:   │
│                 │         │  stream tokens via WS │
│ Realtime:       │         └──────────┬────────────┘
│ • notifications │                    │
│ • chat_messages │         ┌──────────▼────────────┐
│ • briefs        │         │   CurricuLLM API       │
└─────────────────┘         │   POST /v1/chat/compl. │
                            │   curriculum: {stage}  │
                            │   tools: [...]         │
                            │   stream: true/false   │
                            └───────────────────────┘
```

## Data Flow — Teacher Submits Content

```
1. Teacher types in /teacher/compose
2. Click Submit → POST /api/teacher/compose
3. Backend saves brief (status=pending), responds 202
4. BackgroundTask runs run_agent_pipeline(brief_id)
5. Agent processes: simplify → translate → save → notify
6. briefs table updates: status=done
7. notifications rows created for all parents in class
8. Supabase Realtime fires → parent inbox updates live
9. Teacher's dashboard shows brief status=done via Realtime
```

## Data Flow — Parent Chatbot

```
1. Parent opens /parent/chatbot
2. Frontend connects: WS /ws/chatbot/{parent_id}?token=...
3. Parent types question, hits send
4. WS sends: { type: "message", content: "...", brief_id: "..." }
5. Backend calls stream_chatbot_response() — async generator
6. Each token: ws.send { type: "token", token: "..." }
7. Frontend appends token to UI (streaming effect)
8. When done: { type: "done", full_content: "..." }
```

## Data Flow — Real-time Chat

```
1. Teacher opens /teacher/chat, selects parent room
2. Frontend A connects: WS /ws/chat/{room_id}?token=...
3. Server sends message history (last 30 messages)
4. Parent connects to same room from /parent/chat
5. Teacher sends: { type: "message", content: "Hi!" }
6. Server saves to chat_messages table
7. Server broadcasts to all connections in room
8. Parent receives message instantly
```

---

## Team Task Breakdown (recommended)

### Person 1 — Backend Core + Auth
Files to build:
- `backend/auth.py`
- `backend/db/supabase.py`
- `backend/models/schemas.py`
- `backend/main.py`
- `backend/routers/teacher.py`
- `backend/routers/parent.py`
- `backend/tests/` (all test files)

Branch: `feature/backend-core`
Claude Code commands: `/plan`, `/tdd`, `/code-review`

### Person 2 — Agent Pipeline + WebSocket
Files to build:
- `backend/agent/tools.py`
- `backend/agent/pipeline.py` (mock version)
- `backend/routers/chat.py`
- `backend/routers/chatbot.py`

Branch: `feature/agent-websocket`
Claude Code commands: `/plan`, `/build-fix`

### Person 3 — Teacher Frontend
Files to build:
- `frontend/src/app/teacher/` (all pages)
- `frontend/src/components/teacher/`
- `frontend/src/lib/api.ts`
- `frontend/src/types/index.ts`
- `frontend/src/tests/ComposeForm.test.tsx`

Branch: `feature/teacher-frontend`
Claude Code commands: `/plan`, `/frontend-patterns`

### Person 4 — Parent Frontend + Auth setup
Files to build:
- `frontend/src/app/parent/` (all pages)
- `frontend/src/components/parent/`
- `frontend/src/lib/websocket.ts`
- `frontend/src/middleware.ts`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/tests/NotificationCard.test.tsx`

Branch: `feature/parent-frontend`
Claude Code commands: `/plan`, `/frontend-patterns`

---

## Hackathon Feature Coverage

| Hackathon Requirement | Our Feature | Status |
|---|---|---|
| Teacher shares weekly learning goals | Teacher Compose → AI processes → Parent inbox | ✅ |
| Parent-friendly language | CurricuLLM simplification + plain English output | ✅ |
| Multilingual (EAL/D) | 4 languages: en/vi/zh/ar, auto-selected by profile | ✅ |
| Actionable at-home activities | at_home_activities array in brief | ✅ |
| Two-way communication | Real-time Teacher↔Parent chat via WebSocket | ✅ |
| Parent feedback | Feedback form on each notification | ✅ |
| Teacher workload reduction | 1 text input → agent handles everything | ✅ |
| AI-powered transformation | CurricuLLM API (mandatory, integrated) | ✅ |
| Parent chatbot | Streaming chatbot on /parent/chatbot | ✅ |
| Notification inbox | /parent/inbox with Supabase Realtime | ✅ |
| Curriculum alignment | CurricuLLM curriculum field: stage + subject | ✅ |
| Diverse family contexts | Language pref per parent, mobile-first UI | ✅ |

---

## How to Use with Claude Code

Each person should run these in their feature branch:

```bash
# Start a new feature
/plan "Build [your feature] based on CLAUDE.md, API.md, and [relevant .md file]"

# After building
/code-review

# If TypeScript errors
/build-fix

# Run tests
/tdd

# Clean up before PR
/refactor-clean
```

When merging PRs, always:
1. Pull latest main
2. Resolve conflicts (ask Claude Code if needed)
3. Run tests
4. Create PR with description
