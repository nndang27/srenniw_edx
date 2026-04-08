import asyncio
from dotenv import load_dotenv

# Load env vars for supabase
load_dotenv()

from agent.tools.homework import get_tools
from agent.context import current_parent_id, current_student_id, current_class_id
from db.supabase import get_supabase

async def main():
    parent_id = "user_3C1eyxF8CJ0fWqXWDWxwxlL2QFR"
    db_client = get_supabase()
    profile = db_client.table("class_parents").select("class_id, student_id").eq("parent_clerk_id", parent_id).limit(1).execute()
    if profile.data:
        current_parent_id.set(parent_id)
        current_student_id.set(profile.data[0].get("student_id"))
        current_class_id.set(profile.data[0].get("class_id"))
        print("Set context for student_id:", profile.data[0].get("student_id"), "class_id:", profile.data[0].get("class_id"))
    else:
        print("Parent profile not found!")
    
    tools = get_tools()
    tool_map = {t.name: t for t in tools}
    
    curriculum_tool = tool_map["search_curriculum_database"]
    print("\n--- curriculum results for last week ---")
    res = curriculum_tool.invoke({"start_date": "2026-04-01", "end_date": "2026-04-07"})
    print(res)

if __name__ == "__main__":
    asyncio.run(main())
