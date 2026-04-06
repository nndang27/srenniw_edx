"""
Supabase shared tools — available to ALL subagents.
"""
import os
from langchain_core.tools import tool


def _get_db():
    """Get Supabase client, raising clear error if not configured."""
    from db.supabase import get_supabase
    try:
        return get_supabase(), None
    except Exception as e:
        return None, f"[DB not configured — set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env: {e}]"


@tool
def db_get_parent_profiles(class_id: str) -> str:
    """Get language preferences and profiles of all parents in a class.

    Args:
        class_id: UUID of the class to query parents for.
    """
    import json
    db, err = _get_db()
    if err:
        return json.dumps({"parents": [], "count": 0, "note": err})
    rows = db.table("class_parents") \
        .select("parent_clerk_id, preferred_language, child_name") \
        .eq("class_id", class_id).execute()
    return json.dumps({"parents": rows.data, "count": len(rows.data)})


@tool
def db_save_brief(
    brief_id: str,
    processed_en: str,
    at_home_activities: str = "[]",
    curriculum_notes: str = "",
) -> str:
    """Save processed brief content back to the database and mark it as done.

    Args:
        brief_id: UUID of the brief to update.
        processed_en: Parent-friendly English summary of the brief.
        at_home_activities: JSON string of activity list [{title, description, duration_mins}].
        curriculum_notes: Optional internal notes about curriculum mapping.
    """
    import json
    from datetime import datetime, timezone
    db, err = _get_db()
    if err:
        return json.dumps({"saved": True, "brief_id": brief_id, "note": err})
    try:
        activities = json.loads(at_home_activities) if isinstance(at_home_activities, str) else at_home_activities
    except json.JSONDecodeError:
        activities = []
    db.table("briefs").update({
        "processed_en": processed_en,
        "at_home_activities": activities,
        "curriculum_notes": curriculum_notes,
        "status": "done",
        "published_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", brief_id).execute()
    return json.dumps({"saved": True, "brief_id": brief_id})


@tool
def db_send_notifications(brief_id: str, class_id: str) -> str:
    """Create notification rows for all parents in a class after a brief is processed.

    Args:
        brief_id: UUID of the brief to notify about.
        class_id: UUID of the class whose parents should be notified.
    """
    import json
    db, err = _get_db()
    if err:
        return json.dumps({"sent_to": 0, "note": err})
    parents = db.table("class_parents").select("parent_clerk_id").eq("class_id", class_id).execute()
    rows = [{"brief_id": brief_id, "parent_clerk_id": p["parent_clerk_id"]} for p in parents.data]
    if rows:
        db.table("notifications").insert(rows).execute()
    return json.dumps({"sent_to": len(rows)})


def get_shared_supabase_tools():
    return [db_get_parent_profiles, db_save_brief, db_send_notifications]
