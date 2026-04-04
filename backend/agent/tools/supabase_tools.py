from db.supabase import get_supabase
from agent.tools.base import BaseTool, ToolRegistry


class DBGetParentProfilesTool(BaseTool):
    name = "db_get_parent_profiles"
    description = "Get language preferences and profiles of all parents in a class"

    def get_parameters_schema(self):
        return {"type": "object", "properties": {"class_id": {"type": "string"}}, "required": ["class_id"]}

    async def execute(self, class_id: str) -> dict:
        db = get_supabase()
        rows = db.table("class_parents").select("parent_clerk_id, preferred_language, child_name").eq("class_id", class_id).execute()
        return {"parents": rows.data, "count": len(rows.data)}


class DBSaveBriefTool(BaseTool):
    name = "db_save_brief"
    description = "Save processed brief content back to the database"

    def get_parameters_schema(self):
        return {
            "type": "object",
            "properties": {
                "brief_id": {"type": "string"},
                "processed_en": {"type": "string"},
                "at_home_activities": {"type": "array"},
                "curriculum_notes": {"type": "string"}
            },
            "required": ["brief_id", "processed_en", "at_home_activities"]
        }

    async def execute(self, brief_id: str, processed_en: str, at_home_activities: list, curriculum_notes: str = "") -> dict:
        db = get_supabase()
        db.table("briefs").update({
            "processed_en": processed_en,
            "at_home_activities": at_home_activities,
            "curriculum_notes": curriculum_notes,
            "status": "done"
        }).eq("id", brief_id).execute()
        return {"saved": True, "brief_id": brief_id}


class DBSendNotificationsTool(BaseTool):
    name = "db_send_notifications"
    description = "Create notification rows for all parents in a class"

    def get_parameters_schema(self):
        return {
            "type": "object",
            "properties": {"brief_id": {"type": "string"}, "class_id": {"type": "string"}},
            "required": ["brief_id", "class_id"]
        }

    async def execute(self, brief_id: str, class_id: str) -> dict:
        db = get_supabase()
        parents = db.table("class_parents").select("parent_clerk_id").eq("class_id", class_id).execute()
        rows = [{"brief_id": brief_id, "parent_clerk_id": p["parent_clerk_id"]} for p in parents.data]
        if rows:
            db.table("notifications").insert(rows).execute()
        return {"sent_to": len(rows)}


for tool in [DBGetParentProfilesTool(), DBSaveBriefTool(), DBSendNotificationsTool()]:
    ToolRegistry.register(tool)
