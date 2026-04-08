import asyncio
from dotenv import load_dotenv
load_dotenv()
from db.supabase import get_supabase

async def main():
    db = get_supabase()
    class_id = "660cfe51-c93f-49b6-87ee-9d8eda90bedf"
    date_str = "2026-04-06"
    
    mock_data = {
        "essence": "Mathematics lesson focused on the Area Model technique for multiplying 2-digit numbers (e.g. 23x4). Students learned to break numbers into tens and units, calculate partial products, and add them together.",
        "example": "To solve 23 x 4: Split 23 into 20 and 3. Multiply 20 x 4 = 80. Multiply 3 x 4 = 12. Add 80 + 12 = 92.",
    }
    
    res = db.table("briefs").update({
        "summarize_data": mock_data,
        "at_home_activities": "Practice solving 45x6 and 32x5 using the Area Model. Draw the boxes and add the numbers together."
    }).eq("class_id", class_id).eq("date", date_str).execute()
    
    print(f"Updated {len(res.data)} briefs.")

if __name__ == "__main__":
    asyncio.run(main())
