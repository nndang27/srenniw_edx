from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from urllib.parse import quote
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

@router.get("/classes/{class_id}/students")
async def get_class_students(class_id: str, user: dict = Depends(require_teacher)):
    """Return students for a class with their diary-based journal entries."""
    db = get_supabase()
    cls = db.table("classes").select("id").eq("id", class_id).eq("teacher_clerk_id", user["sub"]).execute()
    if not cls.data:
        raise HTTPException(status_code=404, detail="Class not found")
    students = db.table("students").select("id, name, email").eq("class_id", class_id).execute()
    result = []
    for student in students.data:
        diaries = db.table("student_diaries").select(
            "date, subject, cognitive_level, emotion, parent_note, teacher_note"
        ).eq("student_id", student["id"]).order("date").execute()
        journal_entries = [
            {
                "date": str(d["date"]),
                "subject": d["subject"],
                "cognitiveLevel": d["cognitive_level"],
                "emotion": d["emotion"],
                "timeSpent": 30,
                "notes": d.get("parent_note") or d.get("teacher_note") or "",
            }
            for d in diaries.data
        ]
        result.append({
            "id": student["id"],
            "name": student["name"],
            "email": student["email"],
            "avatar": f"https://api.dicebear.com/7.x/personas/svg?seed={quote(student['name'])}&backgroundColor=dbeafe",
            "journalEntries": journal_entries,
        })
    return result


@router.get("/classes/{class_id}/curriculum")
async def get_class_curriculum(class_id: str, user: dict = Depends(require_teacher)):
    """Return course items (materials + assignments) for a class with submission stats."""
    db = get_supabase()
    cls = db.table("classes").select("id, course_id, subject").eq("id", class_id).eq("teacher_clerk_id", user["sub"]).execute()
    if not cls.data:
        raise HTTPException(status_code=404, detail="Class not found")
    class_info = cls.data[0]
    course_id = class_info.get("course_id") or class_id
    class_subject = class_info.get("subject", "General")

    student_count = db.table("students").select("id", count="exact").eq("class_id", class_id).execute().count or 0
    student_map = {s["id"]: s["name"] for s in (db.table("students").select("id, name").eq("class_id", class_id).execute().data or [])}

    items_raw = db.table("course_items").select("*").eq("class_id", class_id).order("week_id").execute()

    def week_id_to_num(week_id: str) -> int:
        try:
            return int(week_id.split("-")[0][1:])
        except Exception:
            return 1

    materials, assignments, all_items = [], [], []
    weekly_topics: list[dict] = []
    seen_weeks: set = set()

    for item in items_raw.data:
        subs, submission_summary = [], None
        if item["type"] == "assignment":
            subs_raw = db.table("student_submissions").select(
                "item_id, student_id, state, late, assigned_grade, draft_grade"
            ).eq("item_id", item["id"]).execute()
            subs = [{
                "student_id": s["student_id"],
                "student_name": student_map.get(s["student_id"], ""),
                "state": s["state"],
                "late": s.get("late", False),
                "assigned_grade": s.get("assigned_grade"),
                "draft_grade": s.get("draft_grade"),
                "submitted_at": None,
            } for s in subs_raw.data]
            turned_in = sum(1 for s in subs if s["state"] == "TURNED_IN")
            grades = [s["assigned_grade"] for s in subs if s["assigned_grade"] is not None]
            submission_summary = {
                "total": len(subs),
                "turned_in": turned_in,
                "graded": len(grades),
                "avg_grade": round(sum(grades) / len(grades), 1) if grades else None,
            }
        formatted = {
            "id": item["id"],
            "type": item["type"],
            "title": item["title"],
            "description": item.get("description", ""),
            "state": item.get("state", "PUBLISHED"),
            "created_time": None,
            "update_time": None,
            "due_date": str(item["due_date"]) if item.get("due_date") else None,
            "max_points": item.get("max_points"),
            "attachments": [],
            "students": subs,
            "submission_summary": submission_summary,
        }
        all_items.append(formatted)
        if item["type"] == "material":
            materials.append(formatted)
            week_num = week_id_to_num(item.get("week_id", "W1"))
            if week_num not in seen_weeks:
                seen_weeks.add(week_num)
                weekly_topics.append({
                    "week": week_num,
                    "subject": class_subject,
                    "topic": item["title"],
                    "learningGoal": (item.get("description") or "")[:200],
                })
        else:
            assignments.append(formatted)

    return {
        "course_id": course_id,
        "student_count": student_count,
        "materials": materials,
        "assignments": assignments,
        "items": all_items,
        "weekly_topics": weekly_topics,
    }


@router.get("/classes/{class_id}/insights")
async def get_class_insights(class_id: str, user: dict = Depends(require_teacher)):
    """
    Compute aggregate insights for all students in a class from diary entries.
    Uses the exact same pipeline as GET /api/parent/insights (_run_tools_on_entries)
    so MI, VARK, and all other sections are computed identically.
    """
    from routers.insights import _run_tools_on_entries
    db = get_supabase()
    cls = db.table("classes").select("id").eq("id", class_id).eq("teacher_clerk_id", user["sub"]).execute()
    if not cls.data:
        raise HTTPException(status_code=404, detail="Class not found")

    students = db.table("students").select("id").eq("class_id", class_id).execute()
    student_ids = [s["id"] for s in students.data]

    # Fetch ALL fields including note scores — same as parent side
    all_entries: list[dict] = []
    for sid in student_ids:
        diaries = db.table("student_diaries").select(
            "date, subject, cognitive_level, emotion, parent_note, teacher_note, parent_note_scores, teacher_note_scores"
        ).eq("student_id", sid).order("date").execute()
        for d in diaries.data:
            all_entries.append({
                "date": str(d["date"]),
                "subject": d["subject"],
                "cognitiveLevel": d["cognitive_level"],
                "emotion": d["emotion"],
                "notes": d.get("parent_note") or d.get("teacher_note") or "",
                "parent_note": d.get("parent_note"),
                "teacher_note": d.get("teacher_note"),
                "parent_note_scores": d.get("parent_note_scores"),
                "teacher_note_scores": d.get("teacher_note_scores"),
            })

    if not all_entries:
        return {"intelligences": {}, "vark": {}, "cognition": {}, "emotion": {},
                "personality": {}, "career": {},
                "meta": {"entry_count": 0, "student_count": len(student_ids)}}

    # Run exact same tool pipeline as parent insights
    result = _run_tools_on_entries(entries=all_entries, child_age=10)
    result["meta"]["student_count"] = len(student_ids)
    return result


@router.patch("/students/{student_id}/diary-note")
async def upsert_teacher_diary_note(
    student_id: str,
    body: dict,
    user: dict = Depends(require_teacher)
):
    """
    Save teacher's observation note for a student's diary entry.

    Steps:
      1. Verify student belongs to one of teacher's classes
      2. Score teacher_note → teacher_note_scores (4 dimensions)
      3. Upsert student_diaries row
    """
    from agent.tools.insights.note_scorer import score_note_fast
    from pydantic import BaseModel

    db = get_supabase()

    # Verify student belongs to teacher's class
    student = db.table("students").select("class_id").eq("id", student_id).limit(1).execute()
    if not student.data:
        raise HTTPException(status_code=404, detail="Student not found")
    class_id = student.data[0]["class_id"]
    cls = db.table("classes").select("id").eq("id", class_id).eq("teacher_clerk_id", user["sub"]).execute()
    if not cls.data:
        raise HTTPException(status_code=403, detail="Not your student")

    date = body.get("date")
    subject = body.get("subject")
    teacher_note = body.get("teacher_note")
    cognitive_level = body.get("cognitive_level")
    emotion = body.get("emotion")

    if not date or not subject:
        raise HTTPException(status_code=400, detail="date and subject are required")

    update_data: dict = {}
    if teacher_note is not None:
        update_data["teacher_note"] = teacher_note
        update_data["teacher_note_scores"] = score_note_fast(teacher_note, "teacher")
    if cognitive_level is not None:
        update_data["cognitive_level"] = cognitive_level
    if emotion is not None:
        update_data["emotion"] = emotion

    existing = db.table("student_diaries").select("id")\
        .eq("student_id", student_id).eq("date", date).eq("subject", subject).limit(1).execute()

    if existing.data:
        db.table("student_diaries").update(update_data).eq("id", existing.data[0]["id"]).execute()
        row_id = existing.data[0]["id"]
    else:
        inserted = db.table("student_diaries").insert({
            "student_id": student_id,
            "date": date,
            "subject": subject,
            **update_data,
        }).execute()
        row_id = inserted.data[0]["id"] if inserted.data else None

    return {"ok": True, "diary_id": row_id, "scores": update_data.get("teacher_note_scores")}


@router.get("/students/{student_id}/insights")
async def get_student_insights(student_id: str, user: dict = Depends(require_teacher)):
    """
    Compute insights for a single student — identical pipeline to GET /api/parent/insights.
    Only accessible by the teacher who owns the student's class.
    """
    from routers.insights import _run_tools_on_entries
    db = get_supabase()

    # Verify student belongs to one of this teacher's classes
    student = db.table("students").select("class_id, name").eq("id", student_id).limit(1).execute()
    if not student.data:
        raise HTTPException(status_code=404, detail="Student not found")
    class_id = student.data[0]["class_id"]
    cls = db.table("classes").select("id").eq("id", class_id).eq("teacher_clerk_id", user["sub"]).execute()
    if not cls.data:
        raise HTTPException(status_code=403, detail="Not your student")

    # Fetch ALL diary entries for this student — same query as parent side
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
        return {"error": "No diary entries found", "student_id": student_id}

    result = _run_tools_on_entries(entries=entries, child_age=10)
    result["meta"]["student_id"] = student_id
    result["meta"]["student_name"] = student.data[0].get("name", "")
    return result


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
