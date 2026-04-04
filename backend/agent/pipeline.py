"""
PIPELINE — Connects FastAPI routers to DeepAgents subagents.

⚡ SWAP POINTS: Only 2 lines to change when plugging in DeepAgents graph:
  BaseSubAgent.run()    → graph.invoke()
  BaseSubAgent.stream() → graph.stream()
"""
from agent.subagents.summarize_agent import SummarizeAgent
from agent.subagents.diary_agent import DiaryAgent
from agent.subagents.suggestion_agent import SuggestionAgent
from agent.subagents.game_agent import GameAgent

_summarize = SummarizeAgent()
_diary = DiaryAgent()
_suggestion = SuggestionAgent()
_game = GameAgent()


async def run_agent_pipeline(brief_id: str, body):
    from db.supabase import get_supabase
    from datetime import datetime, timezone
    db = get_supabase()
    db.table("briefs").update({"status": "processing"}).eq("id", brief_id).execute()
    try:
        result = await _summarize.process_brief(
            raw_input=body.raw_input, subject=body.subject,
            year_level=body.year_level, class_id=str(body.class_id), brief_id=brief_id
        )
        check = db.table("briefs").select("status").eq("id", brief_id).execute()
        if check.data[0]["status"] != "done":
            db.table("briefs").update({
                "processed_en": result.get("result", ""), "status": "done",
                "published_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", brief_id).execute()
    except Exception as e:
        db.table("briefs").update({"status": "failed"}).eq("id", brief_id).execute()
        raise e


async def stream_chatbot_response(user_message: str, brief_id: str = None,
                                   feature: str = "summarize"):
    context = {}
    if brief_id:
        from db.supabase import get_supabase
        db = get_supabase()
        brief = db.table("briefs").select("processed_en, subject, year_level").eq("id", brief_id).limit(1).execute()
        if brief.data:
            context = {"brief_content": brief.data[0].get("processed_en", ""),
                       "subject": brief.data[0].get("subject", ""),
                       "year_level": brief.data[0].get("year_level", "")}
    agent = {"summarize": _summarize, "diary": _diary,
             "suggestion": _suggestion, "game": _game}.get(feature, _summarize)
    async for token in agent.stream(user_message, context):
        yield token


async def generate_game_code(concept: str, year_level: str, subject: str,
                              game_type: str, language: str = "en") -> str:
    return await _game.generate_game(concept, year_level, subject, game_type, language)
