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
