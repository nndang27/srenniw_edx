import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

from agent.pipeline import stream_chatbot_response
from db.supabase import get_supabase
from agent.context import current_parent_id, current_student_id, current_class_id

async def ask_chatbot(user_message: str):
    print("\n" + "="*80)
    print(f"👤 USER: {user_message}")
    print("-" * 80)
    print("🤖 AI: ", end="", flush=True)
    try:
        async for chunk in stream_chatbot_response(user_message, brief_id=None, feature="homework"):
            print(chunk, end="", flush=True)
    except Exception as e:
        print(f"\n[ERROR]: {e}")
    print("\n" + "="*80)

async def main():
    parent_id = "user_3C1eyxF8CJ0fWqXWDWxwxlL2QFR"
    db_client = get_supabase()
    profile = db_client.table("class_parents").select("class_id, student_id").eq("parent_clerk_id", parent_id).limit(1).execute()
    if profile.data:
        current_parent_id.set(parent_id)
        current_student_id.set(profile.data[0].get("student_id"))
        current_class_id.set(profile.data[0].get("class_id"))
    else:
        print("No parent found.")
        sys.exit(1)

    queries = [
        # Query 1: Exact pinpoint referencing specific subject and date
        "On April 4, 2026, what did he feel about his math class?",
        
        # Query 2: Progression analysis using tight date ranges
        "Analyze his emotional progression in Maths from April 3, 2026 to April 7, 2026.",
        
        # Query 3: Hallucination-check for subjects not present
        "Did he learn any Science in the past two weeks? If not, what subject was actually covered?",
        
        # Query 4: Combining emotion state cross-checks with curriculum context
        "He was frustrated on April 6. Did he have any homework on that day, or what general topic did he learn that day?",
        
        # Query 5: Blending multi-tools (wellbeing trend + cognitive insight + external health knowledge)
        "Can you correlate his general emotions with his cognitive levels over the first week of April? Also, what are some brain-boosting nutrition tips to help?",
        
        # Query 6: Pedagogical Reasoning based on real curriculum data
        "What was the main mathematical concept he learned on April 6th, and how can I practice it with him at home?",
    ]
    
    # We will only run query 6 for speed in this test
    queries = [queries[-1]]
    
    for i, q in enumerate(queries, 6):
        print(f"\n[{i}/6] Testing Query...")
        await ask_chatbot(q)

if __name__ == "__main__":
    asyncio.run(main())
