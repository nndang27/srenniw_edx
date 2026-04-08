import asyncio
from dotenv import load_dotenv
load_dotenv()
from db.supabase import get_supabase

async def main():
    db = get_supabase()
    n = db.table("notifications").select("*").execute()
    print("ALL NOTIFS:", n.data)
    
    b = db.table("briefs").select("id, status, class_id").execute()
    print("ALL BRIEFS:", b.data)
    
    cp = db.table("class_parents").select("*").execute()
    print("ALL CLASS PARENTS:", cp.data)

if __name__ == "__main__":
    asyncio.run(main())
