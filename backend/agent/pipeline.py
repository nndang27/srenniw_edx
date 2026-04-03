"""
Agent Pipeline — MOCK implementation.
Replace the two functions below with real CurricuLLM API calls when ready.
The interface (function signatures, DB writes, generator protocol) stays the same.
"""
import asyncio
from typing import AsyncGenerator
from db.supabase import get_supabase

# ---------------------------------------------------------------------------
# MOCK — replace with real CurricuLLM calls
# ---------------------------------------------------------------------------

async def run_agent_pipeline(brief_id: str, compose_input) -> None:
    """
    MOCK agent pipeline:
    1. Marks brief as 'processing'
    2. Simulates AI processing delay
    3. Writes mock simplified content + activities to briefs table
    4. Creates translation rows for vi/zh/ar
    5. Creates notification rows for all parents in the class
    6. Marks brief as 'done'
    """
    db = get_supabase()

    # Step 1: Mark as processing
    db.table("briefs").update({"status": "processing"}).eq("id", brief_id).execute()

    # MOCK: Simulate agent processing time
    await asyncio.sleep(2)

    # MOCK: Generate simplified content and activities
    subject = getattr(compose_input, "subject", "the topic")
    year_level = getattr(compose_input, "year_level", "students")
    raw_input = getattr(compose_input, "raw_input", "")

    processed_en = (
        f"This week in {subject}, your child ({year_level}) is working on: "
        f"{raw_input[:200]}. "
        f"The teacher has shared some activities you can do at home to support their learning."
    )

    at_home_activities = [
        {
            "title": f"Explore {subject} at home",
            "description": f"Spend 10 minutes talking with your child about what they learned in {subject} today. Ask them to explain one thing they found interesting.",
            "duration_mins": 10
        },
        {
            "title": "Practice activity",
            "description": f"Help your child complete a short {subject} activity. Look for everyday examples around your home that relate to {subject}.",
            "duration_mins": 15
        },
        {
            "title": "Review and reflect",
            "description": "Ask your child: 'What was hard today? What do you want to learn more about?' Listen and encourage them.",
            "duration_mins": 5
        }
    ]

    curriculum_notes = f"Aligned with {year_level} {subject} curriculum. Focus on building understanding through real-world connections."

    # Step 2: Update brief with processed content
    from datetime import datetime, timezone
    db.table("briefs").update({
        "processed_en": processed_en,
        "at_home_activities": at_home_activities,
        "curriculum_notes": curriculum_notes,
        "status": "done",
        "published_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", brief_id).execute()

    # Step 3: Create translation rows for vi, zh, ar
    # MOCK translations — replace with real CurricuLLM translate calls
    mock_translations = {
        "vi": {
            "content": f"[Tiếng Việt] {processed_en}",
            "activities_translated": [
                {**a, "title": f"[VI] {a['title']}", "description": f"[Tiếng Việt] {a['description']}"}
                for a in at_home_activities
            ]
        },
        "zh": {
            "content": f"[中文] {processed_en}",
            "activities_translated": [
                {**a, "title": f"[ZH] {a['title']}", "description": f"[中文] {a['description']}"}
                for a in at_home_activities
            ]
        },
        "ar": {
            "content": f"[عربي] {processed_en}",
            "activities_translated": [
                {**a, "title": f"[AR] {a['title']}", "description": f"[عربي] {a['description']}"}
                for a in at_home_activities
            ]
        }
    }

    for lang, translation in mock_translations.items():
        db.table("translations").insert({
            "brief_id": brief_id,
            "language": lang,
            "content": translation["content"],
            "activities_translated": translation["activities_translated"]
        }).execute()

    # Step 4: Get the class_id for this brief and notify all parents
    brief_result = db.table("briefs").select("class_id").eq("id", brief_id).limit(1).execute()
    if not brief_result.data:
        return

    class_id = brief_result.data[0]["class_id"]
    parents_result = db.table("class_parents").select("parent_clerk_id").eq("class_id", class_id).execute()

    for parent in (parents_result.data or []):
        db.table("notifications").insert({
            "brief_id": brief_id,
            "parent_clerk_id": parent["parent_clerk_id"],
            "is_read": False
        }).execute()


async def stream_chatbot_response(
    user_message: str,
    brief_id: str | None = None
) -> AsyncGenerator[str, None]:
    """
    MOCK streaming chatbot response.
    Yields tokens one word at a time.
    Replace with real CurricuLLM streaming API call.
    """
    # MOCK: Build a helpful response based on the message
    if "activit" in user_message.lower():
        response = (
            "Here are some more activities you can try at home! "
            "For reading, spend 15 minutes each evening reading together. "
            "For maths, look for patterns in everyday objects like tiles or fences. "
            "For science, observe nature outside and ask questions about what you see. "
            "All of these support what your child is learning in class."
        )
    elif "mean" in user_message.lower() or "explain" in user_message.lower():
        response = (
            "Let me explain that in simpler terms. "
            "The teacher wants your child to practise and explore ideas they are learning in class. "
            "The goal is to make learning feel natural and fun at home, not like extra homework. "
            "Even a short 10-minute conversation about what they learned today makes a big difference."
        )
    elif "curriculum" in user_message.lower():
        response = (
            "The Australian curriculum for this year level focuses on building strong foundations. "
            "Students learn through hands-on activities, discussion, and real-world connections. "
            "The activities the teacher suggests are aligned to these learning goals. "
            "If you have specific questions about the curriculum, the teacher is happy to chat."
        )
    else:
        response = (
            f"Thank you for your question about: '{user_message}'. "
            "The teacher has designed this learning to help your child grow. "
            "If you are unsure about anything, the best step is to try the suggested activities "
            "and see how your child responds. "
            "You can also send the teacher a message directly through the Chat section. "
            "Your involvement at home makes a real difference to your child's learning."
        )

    # Stream word by word (MOCK)
    words = response.split(" ")
    for i, word in enumerate(words):
        # Add space before word (except first)
        token = word if i == 0 else " " + word
        yield token
        await asyncio.sleep(0.05)  # MOCK: simulate streaming delay
