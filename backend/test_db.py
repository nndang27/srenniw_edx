import asyncio
from dotenv import load_dotenv
load_dotenv()
from db.supabase import get_supabase

async def main():
    try:
        db = get_supabase()
        
        # Test the exact query
        notifs = db.table("notifications") \
            .select("*, briefs(id, content_type, subject, processed_en, at_home_activities, published_at)") \
            .eq("parent_clerk_id", "user_3C1eyxF8CJ0fWqXWDWxwxlL2QFR").execute()
            
        print("MOCKED GET_INBOX QUERY:", notifs.data)
        
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    asyncio.run(main())
