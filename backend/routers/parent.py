from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from auth import require_parent
from db.supabase import get_supabase
from models.schemas import FeedbackCreate, ProfileUpdate, DiaryNoteUpdate

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

@router.get("/diary")
async def get_parent_diary(user: dict = Depends(require_parent)):
    """Return all diary entries for the parent's child."""
    db = get_supabase()
    profile = db.table("class_parents").select("student_id").eq("parent_clerk_id", user["sub"]).limit(1).execute()
    if not profile.data or not profile.data[0].get("student_id"):
        return []
    student_id = profile.data[0]["student_id"]
    diaries = db.table("student_diaries").select(
        "date, subject, cognitive_level, emotion, parent_note, teacher_note, parent_note_scores, teacher_note_scores"
    ).eq("student_id", student_id).order("date").execute()
    return [{
        "date": str(d["date"]),
        "subject": d["subject"],
        "cognitiveLevel": d["cognitive_level"],
        "emotion": d["emotion"],
        "timeSpent": 30,
        "notes": d.get("parent_note") or d.get("teacher_note") or "",
        "parent_note": d.get("parent_note"),
        "teacher_note": d.get("teacher_note"),
        "parent_note_scores": d.get("parent_note_scores"),
        "teacher_note_scores": d.get("teacher_note_scores"),
    } for d in diaries.data]


@router.get("/insights")
async def get_parent_insights_from_db(user: dict = Depends(require_parent)):
    """Compute child development insights from DB diary entries."""
    db = get_supabase()
    profile = db.table("class_parents").select("student_id").eq("parent_clerk_id", user["sub"]).limit(1).execute()
    if not profile.data or not profile.data[0].get("student_id"):
        return {"error": "No student found"}
    student_id = profile.data[0]["student_id"]
    diaries = db.table("student_diaries").select(
        "date, subject, cognitive_level, emotion, parent_note, teacher_note, parent_note_scores, teacher_note_scores"
    ).eq("student_id", student_id).order("date").execute()
    entries = [{
        "date": str(d["date"]),
        "subject": d["subject"],
        "cognitiveLevel": d["cognitive_level"],
        "emotion": d["emotion"],
        "notes": d.get("parent_note") or d.get("teacher_note") or "",
        "parent_note": d.get("parent_note"),
        "teacher_note": d.get("teacher_note"),
        "parent_note_scores": d.get("parent_note_scores"),
        "teacher_note_scores": d.get("teacher_note_scores"),
    } for d in diaries.data]
    if not entries:
        return {"error": "No diary entries found"}
    from routers.insights import _run_tools_on_entries
    return _run_tools_on_entries(entries=entries, child_age=10)


@router.get("/weekly-digest")
async def get_weekly_digest(user: dict = Depends(require_parent)):
    """Return this week's briefs formatted as the Smart Digest view."""
    db = get_supabase()
    profile = db.table("class_parents").select("class_id").eq("parent_clerk_id", user["sub"]).limit(1).execute()
    if not profile.data:
        return {}
    class_id = profile.data[0]["class_id"]
    briefs = db.table("briefs").select(
        "id, subject, date, summarize_data, deepdive_data, tiktok_data"
    ).eq("class_id", class_id).eq("status", "published").order("date", desc=True).limit(5).execute()
    result: dict = {}
    for brief in briefs.data:
        try:
            day_name = datetime.strptime(str(brief["date"]), "%Y-%m-%d").strftime("%A")
        except Exception:
            day_name = "Monday"
        summarize = brief.get("summarize_data") or {}
        deepdive  = brief.get("deepdive_data") or {}
        tiktok    = brief.get("tiktok_data") or {}
        kv_list   = deepdive.get("key_vocabulary", [])
        kv_dict: dict = {}
        if isinstance(kv_list, list):
            kv_dict = {kv["term"]: kv["definition"] for kv in kv_list if isinstance(kv, dict) and "term" in kv}
        elif isinstance(kv_list, dict):
            kv_dict = kv_list
        videos = [tiktok["video_local_path"]] if tiktok.get("video_local_path") else []
        entry = {
            "subject": brief.get("subject", ""),
            "summarize_simplification": {
                "essence_text": summarize.get("essence", ""),
                "relatable_example": summarize.get("example", ""),
            },
            "more_knowledge_accordion": {
                "core_concept": deepdive.get("core_concept", ""),
                "key_vocabulary": kv_dict,
                "why_this_matters": deepdive.get("why_this_matters", ""),
            },
            "tiktok_search_keywords": [],
            "videos": videos,
        }
        result.setdefault(day_name, []).append(entry)
    return result


@router.get("/transcript")
async def get_transcript(year: str = None, semester: str = "Semester 1", user: dict = Depends(require_parent)):
    """Return transcript built from student_submissions for the parent's child."""
    db = get_supabase()
    profile = db.table("class_parents").select("student_id, class_id")\
        .eq("parent_clerk_id", user["sub"]).limit(1).execute()
    if not profile.data:
        return {"year": year, "semester": semester, "status": "future", "grades": []}

    student_id = profile.data[0]["student_id"]
    class_id   = profile.data[0]["class_id"]

    cls = db.table("classes").select("subject, year_level").eq("id", class_id).limit(1).execute()
    subject = cls.data[0]["subject"] if cls.data else "Maths"

    subs = db.table("student_submissions").select("*")\
        .eq("student_id", student_id).execute()

    if not subs.data:
        return {"year": year, "semester": semester, "status": "in-progress", "grades": [
            {"subject": subject, "achievement": "Working Towards", "grade": "C",
             "effort": "Good", "comment": "Continuing to develop skills.", "score": 60}
        ]}

    grades_list = subs.data
    total = len(grades_list)
    graded = [s for s in grades_list if s.get("assigned_grade") is not None]
    avg_score = sum(s["assigned_grade"] for s in graded) / len(graded) if graded else 70

    if avg_score >= 90:   grade, achievement = "A+", "Exceeding Stage Expectations"
    elif avg_score >= 80: grade, achievement = "A",  "Exceeding Stage Expectations"
    elif avg_score >= 70: grade, achievement = "B",  "Meeting Stage Expectations"
    elif avg_score >= 60: grade, achievement = "C",  "Working Towards Stage Expectations"
    else:                 grade, achievement = "D",  "Working Towards Stage Expectations"

    turned_in = sum(1 for s in grades_list if s.get("state") == "TURNED_IN")
    effort = "Excellent" if turned_in / total > 0.9 else "Good" if turned_in / total > 0.7 else "Satisfactory"

    return {
        "year": year or str(datetime.now().year),
        "semester": semester,
        "status": "in-progress",
        "grades": [{
            "subject": subject,
            "achievement": achievement,
            "grade": grade,
            "effort": effort,
            "comment": f"Completed {turned_in}/{total} assignments with an average score of {avg_score:.0f}%.",
            "score": round(avg_score),
        }]
    }


@router.get("/timetable")
async def get_parent_timetable(user: dict = Depends(require_parent)):
    """Return timetable keyed by date, built from the child's diary entries."""
    db = get_supabase()
    profile = db.table("class_parents").select("student_id, class_id")\
        .eq("parent_clerk_id", user["sub"]).limit(1).execute()
    if not profile.data:
        return {}
    student_id = profile.data[0]["student_id"]
    class_id   = profile.data[0]["class_id"]

    # Get class info for teacher name fallback
    cls = db.table("classes").select("name, subject").eq("id", class_id).limit(1).execute()
    class_subject = cls.data[0]["subject"] if cls.data else "Maths"

    diaries = db.table("student_diaries").select("date, subject, cognitive_level, emotion")\
        .eq("student_id", student_id).order("date").execute()

    # Group by date → list of schedule items
    timetable: dict = {}
    for d in diaries.data:
        date_str = str(d["date"])
        subj = d["subject"] or class_subject
        if date_str not in timetable:
            timetable[date_str] = []
        # Avoid duplicate subjects on same day
        if not any(item["subject"] == subj for item in timetable[date_str]):
            timetable[date_str].append({
                "subject": subj,
                "time": "9:00–10:00",
                "teacher": "Class Teacher",
                "topic": f"{subj} lesson",
                "type": "before-school",
            })
    return timetable


@router.patch("/diary-note")
async def upsert_diary_note(body: DiaryNoteUpdate, user: dict = Depends(require_parent)):
    """
    Save parent's home observation. Runs note scoring pipeline before writing.

    Steps:
      1. Score parent_note → parent_note_scores (6 dimensions)
      2. Upsert student_diaries row (cognitive_level, emotion, parent_note, parent_note_scores)
    Teacher side and parent insights both re-read from DB, so they update on next load.
    """
    from agent.tools.insights.note_scorer import score_note_fast
    db = get_supabase()
    profile = db.table("class_parents").select("student_id").eq("parent_clerk_id", user["sub"]).limit(1).execute()
    if not profile.data or not profile.data[0].get("student_id"):
        raise HTTPException(status_code=404, detail="Student not found")
    student_id = profile.data[0]["student_id"]

    # Build update payload
    update_data: dict = {}
    if body.parent_note is not None:
        update_data["parent_note"] = body.parent_note
        # Run note → dimensions scorer (fast, keyword-based, no LLM needed)
        update_data["parent_note_scores"] = score_note_fast(body.parent_note, "parent")
    if body.cognitive_level is not None:
        update_data["cognitive_level"] = body.cognitive_level
    if body.emotion is not None:
        update_data["emotion"] = body.emotion

    # Upsert: update if row exists, insert otherwise
    existing = db.table("student_diaries").select("id")\
        .eq("student_id", student_id).eq("date", body.date).eq("subject", body.subject).limit(1).execute()

    if existing.data:
        db.table("student_diaries").update(update_data)\
            .eq("id", existing.data[0]["id"]).execute()
        row_id = existing.data[0]["id"]
    else:
        inserted = db.table("student_diaries").insert({
            "student_id": student_id,
            "date": body.date,
            "subject": body.subject,
            **update_data,
        }).execute()
        row_id = inserted.data[0]["id"] if inserted.data else None

    return {"ok": True, "diary_id": row_id, "scores": update_data.get("parent_note_scores")}


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
