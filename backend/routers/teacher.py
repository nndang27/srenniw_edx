from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from auth import require_teacher
from db.supabase import get_supabase
from models.schemas import ClassCreate, ComposeInput
from agent.pipeline import run_agent_pipeline

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
    result = []
    for room in rooms.data:
        last = db.table("chat_messages").select("content,created_at")\
            .eq("room_id", room["id"]).order("created_at", desc=True).limit(1).execute()
        result.append({**room, "last_message": last.data[0]["content"] if last.data else None})
    return result
