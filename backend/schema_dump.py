import asyncio
from dotenv import load_dotenv
load_dotenv()
from db.supabase import get_supabase

async def main():
    db = get_supabase()
    b = db.table("briefs").select("*").limit(1).execute()
    print("BRIEFS:", list(b.data[0].keys()) if b.data else "Empty")
    
    n = db.table("notifications").select("*").limit(1).execute()
    print("NOTIFICATIONS:", list(n.data[0].keys()) if n.data else "Empty")

if __name__ == "__main__":
    asyncio.run(main())
