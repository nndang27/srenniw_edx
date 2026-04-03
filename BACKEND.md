# Backend — Python FastAPI

Read CLAUDE.md and API.md first.

## Setup Instructions

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## requirements.txt
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-jose[cryptography]==3.3.0
supabase==2.5.0
httpx==0.27.0
python-dotenv==1.0.0
websockets==12.0
pydantic==2.7.0
pytest==8.2.0
pytest-asyncio==0.23.0
httpx==0.27.0
```

---

## File: backend/db/supabase.py
```python
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")   # service key bypasses RLS
        )
    return _client
```

---

## File: backend/auth.py
```python
import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

bearer_scheme = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Verify Clerk JWT and return decoded payload."""
    token = credentials.credentials
    public_key = os.getenv("CLERK_PEM_PUBLIC_KEY").replace("\\n", "\n")
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def require_teacher(payload: dict = Depends(verify_token)) -> dict:
    """Only allow teacher role."""
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    return payload

def require_parent(payload: dict = Depends(verify_token)) -> dict:
    """Only allow parent role."""
    if payload.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Parent access required")
    return payload

def verify_ws_token(token: str) -> dict:
    """Verify token from WebSocket query param (not header)."""
    public_key = os.getenv("CLERK_PEM_PUBLIC_KEY").replace("\\n", "\n")
    try:
        return jwt.decode(token, public_key, algorithms=["RS256"], options={"verify_aud": False})
    except JWTError:
        return None
```

---

## File: backend/models/schemas.py
```python
from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID

class ClassCreate(BaseModel):
    name: str
    year_level: str
    subject: str

class ComposeInput(BaseModel):
    class_id: UUID
    content_type: Literal["assignment", "comment", "weekly_update"]
    raw_input: str
    subject: str
    year_level: str

class FeedbackCreate(BaseModel):
    brief_id: UUID
    message: str

class ProfileUpdate(BaseModel):
    preferred_language: Literal["en", "vi", "zh", "ar"]

class ChatMessage(BaseModel):
    type: Literal["message", "typing"]
    content: Optional[str] = None

class ChatbotMessage(BaseModel):
    type: Literal["message"]
    content: str
    brief_id: Optional[str] = None
```

---

## File: backend/routers/teacher.py
```python
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from auth import require_teacher
from db.supabase import get_supabase
from models.schemas import ClassCreate, ComposeInput
from agent.pipeline import run_agent_pipeline
import uuid

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

@router.get("/classes")
async def get_classes(user: dict = Depends(require_teacher)):
    db = get_supabase()
    classes = db.table("classes").select("*").eq("teacher_clerk_id", user["sub"]).execute()
    result = []
    for cls in classes.data:
        count = db.table("class_parents").select("id", count="exact").eq("class_id", cls["id"]).execute()
        result.append({**cls, "parent_count": count.count or 0})
    return result

@router.post("/classes", status_code=201)
async def create_class(body: ClassCreate, user: dict = Depends(require_teacher)):
    db = get_supabase()
    row = db.table("classes").insert({
        "name": body.name,
        "year_level": body.year_level,
        "subject": body.subject,
        "teacher_clerk_id": user["sub"]
    }).execute()
    return row.data[0]

@router.post("/compose", status_code=202)
async def compose(body: ComposeInput, background_tasks: BackgroundTasks, user: dict = Depends(require_teacher)):
    db = get_supabase()
    brief = db.table("briefs").insert({
        "class_id": str(body.class_id),
        "teacher_clerk_id": user["sub"],
        "content_type": body.content_type,
        "raw_input": body.raw_input,
        "subject": body.subject,
        "year_level": body.year_level,
        "status": "pending"
    }).execute()
    brief_id = brief.data[0]["id"]
    # Run agent in background — does not block response
    background_tasks.add_task(run_agent_pipeline, brief_id, body)
    return {"brief_id": brief_id, "status": "pending", "message": "Agent is processing"}

@router.get("/briefs")
async def get_briefs(class_id: str = None, limit: int = 20, offset: int = 0, user: dict = Depends(require_teacher)):
    db = get_supabase()
    query = db.table("briefs").select("*").eq("teacher_clerk_id", user["sub"])
    if class_id:
        query = query.eq("class_id", class_id)
    briefs = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return briefs.data

@router.get("/briefs/{brief_id}/feedback")
async def get_brief_feedback(brief_id: str, user: dict = Depends(require_teacher)):
    db = get_supabase()
    feedback = db.table("feedback").select("*").eq("brief_id", brief_id).order("created_at").execute()
    return {"brief_id": brief_id, "total_feedback": len(feedback.data), "messages": feedback.data}

@router.get("/chat-rooms")
async def get_chat_rooms(user: dict = Depends(require_teacher)):
    db = get_supabase()
    rooms = db.table("chat_rooms").select("*").eq("teacher_clerk_id", user["sub"]).execute()
    # Enrich with last message
    result = []
    for room in rooms.data:
        last = db.table("chat_messages").select("content,created_at")\
            .eq("room_id", room["id"]).order("created_at", desc=True).limit(1).execute()
        result.append({**room, "last_message": last.data[0]["content"] if last.data else None})
    return result
```

---

## File: backend/routers/parent.py
```python
from fastapi import APIRouter, Depends, HTTPException
from auth import require_parent
from db.supabase import get_supabase
from models.schemas import FeedbackCreate, ProfileUpdate

router = APIRouter(prefix="/api/parent", tags=["parent"])

@router.get("/profile")
async def get_profile(user: dict = Depends(require_parent)):
    db = get_supabase()
    profiles = db.table("class_parents").select("*, classes(*)").eq("parent_clerk_id", user["sub"]).execute()
    if not profiles.data:
        return {"parent_clerk_id": user["sub"], "preferred_language": "en", "classes": []}
    p = profiles.data[0]
    return {
        "parent_clerk_id": user["sub"],
        "preferred_language": p.get("preferred_language", "en"),
        "child_name": p.get("child_name"),
        "classes": [p["classes"]] if p.get("classes") else []
    }

@router.patch("/profile")
async def update_profile(body: ProfileUpdate, user: dict = Depends(require_parent)):
    db = get_supabase()
    db.table("class_parents").update({"preferred_language": body.preferred_language})\
        .eq("parent_clerk_id", user["sub"]).execute()
    return {"preferred_language": body.preferred_language}

@router.get("/inbox")
async def get_inbox(limit: int = 20, offset: int = 0, user: dict = Depends(require_parent)):
    db = get_supabase()
    # Get parent's language preference
    profile = db.table("class_parents").select("preferred_language")\
        .eq("parent_clerk_id", user["sub"]).limit(1).execute()
    lang = profile.data[0]["preferred_language"] if profile.data else "en"

    # Get notifications with brief data
    notifs = db.table("notifications")\
        .select("*, briefs(id, content_type, subject, processed_en, at_home_activities, published_at)")\
        .eq("parent_clerk_id", user["sub"])\
        .order("created_at", desc=True)\
        .range(offset, offset + limit - 1).execute()

    unread = db.table("notifications").select("id", count="exact")\
        .eq("parent_clerk_id", user["sub"]).eq("is_read", False).execute()

    # For each item, fetch translation if language != en
    items = []
    for n in notifs.data:
        brief = n.get("briefs", {})
        content = brief.get("processed_en")
        activities = brief.get("at_home_activities")
        if lang != "en" and brief.get("id"):
            trans = db.table("translations").select("content, activities_translated")\
                .eq("brief_id", brief["id"]).eq("language", lang).limit(1).execute()
            if trans.data:
                content = trans.data[0]["content"]
                activities = trans.data[0].get("activities_translated", activities)
        items.append({
            "notification_id": n["id"], "is_read": n["is_read"], "created_at": n["created_at"],
            "brief": {**brief, "content": content, "at_home_activities": activities}
        })
    return {"unread_count": unread.count or 0, "items": items}

@router.patch("/inbox/{notification_id}/read")
async def mark_read(notification_id: str, user: dict = Depends(require_parent)):
    db = get_supabase()
    db.table("notifications").update({"is_read": True})\
        .eq("id", notification_id).eq("parent_clerk_id", user["sub"]).execute()
    return {"is_read": True}

@router.post("/feedback", status_code=201)
async def submit_feedback(body: FeedbackCreate, user: dict = Depends(require_parent)):
    db = get_supabase()
    row = db.table("feedback").insert({
        "brief_id": str(body.brief_id),
        "parent_clerk_id": user["sub"],
        "message": body.message
    }).execute()
    return row.data[0]

@router.get("/chat-rooms")
async def get_chat_rooms(user: dict = Depends(require_parent)):
    db = get_supabase()
    rooms = db.table("chat_rooms").select("*").eq("parent_clerk_id", user["sub"]).execute()
    result = []
    for room in rooms.data:
        last = db.table("chat_messages").select("content,created_at")\
            .eq("room_id", room["id"]).order("created_at", desc=True).limit(1).execute()
        result.append({**room, "last_message": last.data[0]["content"] if last.data else None})
    return result
```

---

## File: backend/routers/chat.py — Real-time Chat WebSocket
```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from auth import verify_ws_token
from db.supabase import get_supabase
import json, uuid
from datetime import datetime

router = APIRouter(tags=["chat"])

# In-memory room connections: { room_id: [websocket, ...] }
rooms: dict[str, list[WebSocket]] = {}

@router.websocket("/ws/chat/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: str, token: str):
    # Verify token
    payload = verify_ws_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    await websocket.accept()
    sender_id = payload["sub"]
    sender_role = payload.get("role", "unknown")

    # Send message history on connect
    db = get_supabase()
    history = db.table("chat_messages").select("*")\
        .eq("room_id", room_id).order("created_at").limit(30).execute()
    await websocket.send_json({"type": "history", "messages": history.data})

    # Join room
    rooms.setdefault(room_id, []).append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "typing":
                for ws in rooms.get(room_id, []):
                    if ws != websocket:
                        await ws.send_json({"type": "typing", "sender_id": sender_id})
            elif data.get("type") == "message":
                # Save to DB
                row = db.table("chat_messages").insert({
                    "room_id": room_id,
                    "sender_id": sender_id,
                    "sender_role": sender_role,
                    "content": data["content"]
                }).execute()
                msg = row.data[0]
                # Broadcast to all in room
                for ws in rooms.get(room_id, []):
                    await ws.send_json({"type": "message", **msg})
    except WebSocketDisconnect:
        rooms[room_id] = [ws for ws in rooms[room_id] if ws != websocket]
```

---

## File: backend/routers/chatbot.py — AI Chatbot Streaming WebSocket
```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from auth import verify_ws_token
from agent.pipeline import stream_chatbot_response
import json

router = APIRouter(tags=["chatbot"])

@router.websocket("/ws/chatbot/{parent_id}")
async def websocket_chatbot(websocket: WebSocket, parent_id: str, token: str):
    payload = verify_ws_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") != "message":
                continue

            user_message = data["content"]
            brief_id = data.get("brief_id")

            full_response = ""
            try:
                # Stream tokens from agent pipeline
                async for token_text in stream_chatbot_response(user_message, brief_id):
                    full_response += token_text
                    await websocket.send_json({"type": "token", "token": token_text})
                await websocket.send_json({"type": "done", "full_content": full_response})
            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})
    except WebSocketDisconnect:
        pass
```

---

## File: backend/main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import teacher, parent, chat, chatbot

app = FastAPI(title="Srenniw API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teacher.router)
app.include_router(parent.router)
app.include_router(chat.router)
app.include_router(chatbot.router)

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
```
