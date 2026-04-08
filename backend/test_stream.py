import asyncio
from dotenv import load_dotenv
load_dotenv()
from db.supabase import get_supabase
from agent.pipeline import stream_chatbot_response

async def main():
    print("Testing stream...")
    count = 0
    try:
        db = get_supabase()
        briefs = db.table("briefs").select("id").limit(1).execute()
        brief_id = briefs.data[0]["id"] if briefs.data else None
        
        async for chunk in stream_chatbot_response("hello, what did my kid learn recently?", brief_id, "homework"):
            pass
            # Chunk is already printed via DEBUG STREAM inside pipeline.py
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    asyncio.run(main())
