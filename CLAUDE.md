# Srenniw — EDX Hackathon: Connecting Home and School

## Project Mission
AI-powered platform that bridges communication between teachers and parents.
Teacher writes content → AI agent processes/translates → Parent receives as actionable notification.
Parents can chat with AI about curriculum. Teachers and parents can chat directly in real-time.

## Hackathon Requirements Checklist
- [x] Use CurricuLLM API (mandatory)
- [x] Translate curriculum language into parent-friendly format
- [x] Actionable at-home activity suggestions
- [x] Multilingual support (EAL/D: Vietnamese, Mandarin, Arabic, English)
- [x] Two-way communication (real-time chat Teacher ↔ Parent)
- [x] Reduce teacher workload (1 input → AI handles everything)
- [x] Parent chatbot for curriculum questions (streaming)
- [x] Notification inbox for parents

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Package manager:** pnpm (always use pnpm, never npm or yarn)
- **Backend:** Python 3.11, FastAPI, uvicorn
- **Auth:** Clerk (role-based: teacher | parent)
- **Database:** Supabase (PostgreSQL + Realtime + RLS)
- **AI Agent:** CurricuLLM API (OpenAI-compatible, mocked for now — easy swap)
- **Real-time:** WebSocket (FastAPI) for chat + chatbot streaming
- **Notifications:** Supabase Realtime subscriptions

## Repository Structure
```
Srenniw_edx_hackathons/
├── CLAUDE.md                 ← this file
├── ARCHITECTURE.md           ← system design
├── DATABASE.md               ← Supabase schema + RLS
├── API.md                    ← REST + WebSocket API contracts
├── FRONTEND.md               ← Next.js build guide
├── BACKEND.md                ← FastAPI build guide
├── AGENT.md                  ← Agent pipeline (mock + swap guide)
├── TESTING.md                ← Test instructions
├── frontend/                 ← Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              ← landing / role redirect
│   │   │   ├── teacher/
│   │   │   │   ├── layout.tsx        ← teacher shell + nav
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── compose/page.tsx  ← write assignment/comment
│   │   │   │   └── chat/page.tsx     ← real-time chat list
│   │   │   ├── parent/
│   │   │   │   ├── layout.tsx        ← parent shell + nav
│   │   │   │   ├── inbox/page.tsx    ← notification inbox
│   │   │   │   ├── chatbot/page.tsx  ← AI chatbot (streaming)
│   │   │   │   └── chat/page.tsx     ← real-time chat with teacher
│   │   │   └── sign-in/[[...sign-in]]/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                   ← shadcn components
│   │   │   ├── teacher/
│   │   │   ├── parent/
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── api.ts                ← typed API client (REST)
│   │   │   ├── websocket.ts          ← WebSocket client hook
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts              ← shared TypeScript types
│   ├── package.json
│   └── .env.local
└── backend/
    ├── main.py
    ├── auth.py                       ← Clerk JWT verification
    ├── routers/
    │   ├── teacher.py                ← teacher REST endpoints
    │   ├── parent.py                 ← parent REST endpoints
    │   ├── chat.py                   ← real-time chat WebSocket
    │   └── chatbot.py                ← AI chatbot WebSocket (streaming)
    ├── agent/
    │   ├── pipeline.py               ← MOCK agent (swap real one here)
    │   └── tools.py                  ← tool definitions for CurricuLLM
    ├── db/
    │   └── supabase.py               ← Supabase client singleton
    ├── models/
    │   └── schemas.py                ← Pydantic models
    ├── tests/
    │   ├── test_teacher.py
    │   ├── test_parent.py
    │   └── test_auth.py
    ├── requirements.txt
    └── .env

## Key Design Decisions

### Role Separation
- Clerk handles auth + role assignment (public_metadata.role = "teacher" | "parent")
- Every FastAPI route checks role from JWT — teacher routes reject parents and vice versa
- Frontend redirects on login based on role: /teacher/dashboard or /parent/inbox

### Agent as Middleware
- Teacher submits content → POST /api/teacher/compose
- Backend saves as status="pending", kicks off agent pipeline async
- Agent (CurricuLLM) processes: simplifies language, adds at-home activities, translates
- Agent saves result to briefs table, creates translation rows, status="done"
- Supabase Realtime fires notification to all parents in class
- Frontend parent inbox updates live without refresh

### WebSocket Architecture
Two separate WebSocket endpoints:
1. /ws/chat/{room_id} — real-time Teacher↔Parent text chat
2. /ws/chatbot/{parent_id} — AI chatbot with token streaming

### Streaming Chatbot
- Frontend opens WebSocket to /ws/chatbot/{parent_id}
- Sends message as JSON: {"message": "...", "brief_id": "..."}
- Backend streams CurricuLLM response token by token
- Frontend appends tokens to UI as they arrive
- On done: sends {"type": "done"} signal

## What NOT to Do
- Do NOT use LangChain, LangGraph, or any agent framework
- Do NOT use npm or yarn — always pnpm
- Do NOT over-engineer auth flows — use Clerk defaults
- Do NOT make the agent pipeline complex — keep mock simple and clearly labeled
- Do NOT block the main thread in agent pipeline — use async/await throughout
- Do NOT test the agent pipeline — test only REST endpoints and WebSocket handshake

## Environment Variables

### frontend/.env.local
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### backend/.env
```
CLERK_PEM_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
CURRICULLM_API_KEY=your_curricullm_key
CURRICULLM_BASE_URL=https://api.curricullm.com
```

## Running the Project
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev
```
