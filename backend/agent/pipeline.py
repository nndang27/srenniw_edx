"""
PIPELINE — Kết nối FastAPI routers với core/create_deep_agent().
════════════════════════════════════════════════════════════════

ĐỔI MODEL TOÀN HỆ THỐNG:  set env AGENT_MODEL="openai:gpt-4o"
ĐỔI MODEL TỪNG FEATURE:    chỉnh DEFAULT_MODEL trong file subagent tương ứng

PROVIDER FORMAT:
  "anthropic:claude-sonnet-4-6"     → Claude (default)
  "openai:gpt-4o"                   → OpenAI
  "google:gemini-2.0-flash"         → Google Gemini
  "zhipuai:glm-4"                   → ZhipuAI GLM (CN)
  "openrouter:meta-llama/llama-3.1" → OpenRouter (mọi provider)

LUỒNG:
  run_agent_pipeline()      → orchestrator.ainvoke()  (background task)
  stream_chatbot_response() → feature_agent.astream() (WebSocket stream)
  generate_game_code()      → game_agent.ainvoke()    (REST response)
"""
import os
from langchain_core.messages import HumanMessage

from agent.core import create_deep_agent
from agent.core._models import resolve_model
from agent.subagents.summarize_agent import get_subagent_spec as summarize_spec
from agent.subagents.diary_agent import get_subagent_spec as diary_spec
from agent.subagents.suggestion_agent import get_subagent_spec as suggestion_spec
from agent.subagents.game_agent import get_subagent_spec as game_spec
from agent.tools.curricullm_tools import get_shared_curricullm_tools
from agent.tools.supabase_tools import get_shared_supabase_tools

# ── Orchestrator model (fallback nếu subagent không set model riêng) ─────────
_ORCHESTRATOR_MODEL = os.getenv("AGENT_MODEL", "anthropic:claude-sonnet-4-6")

_shared_tools = get_shared_curricullm_tools() + get_shared_supabase_tools()

# ── Orchestrator: dùng cho run_agent_pipeline (teacher compose) ──────────────
_orchestrator = create_deep_agent(
    model=resolve_model(_ORCHESTRATOR_MODEL),
    tools=_shared_tools,
    system_prompt="""You are an educational AI orchestrator for Australian primary schools.

Coordinate specialist subagents to process teacher briefs and assist parents.

For teacher briefs: use the 'summarize' subagent, then verify db_save_brief was called.
For diary analysis: delegate to the 'diary' subagent.
For activity suggestions: delegate to the 'suggestion' subagent.
For game generation: delegate to the 'game' subagent.

Always delegate — do not process content yourself.""",
    subagents=[
        summarize_spec(),
        diary_spec(),
        suggestion_spec(),
        game_spec(),
    ],
)

# ── Per-feature standalone agents: dùng cho chatbot streaming ────────────────
def _build_feature_agent(spec_fn):
    spec = spec_fn()
    return create_deep_agent(
        model=resolve_model(spec.get("model", _ORCHESTRATOR_MODEL)),
        tools=list(spec.get("tools", [])),
        system_prompt=spec["system_prompt"],
    )

_feature_agents = {
    "summarize": _build_feature_agent(summarize_spec),
    "diary":     _build_feature_agent(diary_spec),
    "suggestion": _build_feature_agent(suggestion_spec),
    "game":      _build_feature_agent(game_spec),
}


# ═════════════════════════════════════════════════════════════════════════════
# PUBLIC API — called by FastAPI routers (interface không đổi)
# ═════════════════════════════════════════════════════════════════════════════

async def run_agent_pipeline(brief_id: str, body):
    """Background task: teacher submits → orchestrator processes → DB saved."""
    from db.supabase import get_supabase
    from datetime import datetime, timezone

    db = get_supabase()
    db.table("briefs").update({"status": "processing"}).eq("id", brief_id).execute()
    try:
        prompt = (
            f"Process this teacher brief.\n"
            f"brief_id: {brief_id}\n"
            f"subject: {body.subject}\n"
            f"year_level: {body.year_level}\n"
            f"class_id: {body.class_id}\n\n"
            f"Teacher content:\n{body.raw_input}\n\n"
            "Delegate to the 'summarize' subagent. "
            "Ensure db_save_brief and db_send_notifications are called."
        )
        result = await _orchestrator.ainvoke({
            "messages": [HumanMessage(content=prompt)]
        })
        # Safety fallback: if subagent didn't call db_save_brief, save directly
        check = db.table("briefs").select("status").eq("id", brief_id).execute()
        if check.data and check.data[0]["status"] not in ("done",):
            final_msg = result.get("messages", [])
            content = final_msg[-1].content if final_msg else ""
            db.table("briefs").update({
                "processed_en": content,
                "status": "done",
                "published_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", brief_id).execute()
    except Exception as e:
        db.table("briefs").update({"status": "failed"}).eq("id", brief_id).execute()
        raise e


async def stream_chatbot_response(
    user_message: str,
    brief_id: str = None,
    feature: str = "summarize",
):
    """Stream chatbot response token-by-token for parent WebSocket."""
    # Build context from brief if provided
    context_prefix = ""
    if brief_id:
        from db.supabase import get_supabase
        db = get_supabase()
        brief = db.table("briefs") \
            .select("processed_en, subject, year_level") \
            .eq("id", brief_id).limit(1).execute()
        if brief.data:
            b = brief.data[0]
            context_prefix = (
                f"Context for this conversation:\n"
                f"Subject: {b.get('subject', '')}\n"
                f"Year Level: {b.get('year_level', '')}\n"
                f"Brief summary: {b.get('processed_en', '')}\n\n"
            )

    full_message = context_prefix + user_message
    agent = _feature_agents.get(feature, _feature_agents["summarize"])

    try:
        async for chunk in agent.astream(
            {"messages": [HumanMessage(content=full_message)]},
            stream_mode="messages",
        ):
            # LangGraph stream_mode="messages" → (AIMessageChunk, metadata) tuple
            msg = chunk[0] if isinstance(chunk, tuple) else chunk
            content = getattr(msg, "content", "")
            if not content:
                continue
            if isinstance(content, str):
                yield content
            elif isinstance(content, list):
                # Anthropic returns list of content blocks
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        yield block["text"]
    except Exception:
        # Fallback: non-streaming invoke
        result = await agent.ainvoke({"messages": [HumanMessage(content=full_message)]})
        msgs = result.get("messages", [])
        if msgs:
            yield msgs[-1].content


async def generate_game_code(
    concept: str,
    year_level: str,
    subject: str,
    game_type: str,
    language: str = "en",
) -> str:
    """Generate a complete React educational game component."""
    agent = _feature_agents["game"]
    prompt = (
        f"Generate a React educational mini-game:\n"
        f"- Concept: {concept}\n"
        f"- Year Level: {year_level}\n"
        f"- Subject: {subject}\n"
        f"- Game Type: {game_type}\n"
        f"- Language: {language}\n\n"
        "Return ONLY the complete React code, no explanation."
    )
    result = await agent.ainvoke({"messages": [HumanMessage(content=prompt)]})
    msgs = result.get("messages", [])
    return msgs[-1].content if msgs else ""
