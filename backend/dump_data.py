import asyncio
from dotenv import load_dotenv
load_dotenv()
from db.supabase import get_supabase

async def main():
    db = get_supabase()
    parent_id = "user_3C1eyxF8CJ0fWqXWDWxwxlL2QFR"
    profile = db.table("class_parents").select("class_id, student_id").eq("parent_clerk_id", parent_id).limit(1).execute()
    if not profile.data:
        print("No profile found.")
        return
    class_id = profile.data[0]["class_id"]
    student_id = profile.data[0]["student_id"]
    
    print(f"Student: {student_id}, Class: {class_id}")
    
    diaries = db.table("student_diaries").select("date, subject, emotion, cognitive_level, parent_note").eq("student_id", student_id).order("date", desc=True).limit(20).execute()
    print("\n--- RECENT DIARIES ---")
    for d in diaries.data:
        print(f"Date: {d['date']}, Subject: {d['subject']}, Emotion: {d['emotion']}, Cog: {d['cognitive_level']}, Note: {d.get('parent_note')}")
        
    briefs = db.table("briefs").select("date, subject, summarize_data, at_home_activities").eq("class_id", class_id).eq("status", "published").order("date", desc=True).limit(20).execute()
    print("\n--- RECENT BRIEFS ---")
    for b in briefs.data:
        sum_dat = b.get("summarize_data") or {}
        ess = sum_dat.get("essence")
        print(f"Date: {b['date']}, Subject: {b['subject']}, Essence: {ess}, Home: {b['at_home_activities']}")

if __name__ == "__main__":
    asyncio.run(main())
