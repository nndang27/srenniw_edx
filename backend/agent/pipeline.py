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
from agent.subagents.deepdive_agent import get_subagent_spec as deepdive_spec
from agent.subagents.tiktokpull_agent import get_subagent_spec as tiktokpull_spec
from agent.subagents.diary_agent import get_subagent_spec as diary_spec
from agent.subagents.suggestion_agent import get_subagent_spec as suggestion_spec
from agent.subagents.game_agent import get_subagent_spec as game_spec
from agent.subagents.homework_agent import get_subagent_spec as homework_spec
from agent.tools.curricullm_tools import get_shared_curricullm_tools
from agent.tools.supabase_tools import get_shared_supabase_tools
from langchain_openai import ChatOpenAI

# ── Orchestrator model (fallback nếu subagent không set model riêng) ─────────
_ORCHESTRATOR_MODEL = os.getenv("AGENT_MODEL", "anthropic:claude-sonnet-4-6")

_shared_tools = get_shared_curricullm_tools() + get_shared_supabase_tools()


model = ChatOpenAI(
    model= "minimax-m2.5:cloud",
    base_url="http://localhost:11434/v1",
    api_key="ollama",
    temperature=0.7,
)

# ── Orchestrator: dùng cho run_agent_pipeline (teacher compose) ──────────────
_orchestrator = create_deep_agent(
    model=model,
    tools=_shared_tools,
    system_prompt="""You are an educational AI orchestrator for Australian primary schools.

Coordinate specialist subagents to process teacher briefs and assist parents.

For teacher briefs: first delegate to the 'deepdive' subagent to break down the material. Then, feed both the raw teacher brief and the deepdive output directly to the 'summarize' subagent so it can synthesize everything. Ensure db_save_brief was called.
For diary analysis: delegate to the 'diary' subagent.
For activity suggestions: delegate to the 'suggestion' subagent.
For game generation: delegate to the 'game' subagent.

Always delegate — do not process content yourself.""",
    subagents=[
        deepdive_spec(),
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
        model=model,   # dùng cùng minimax via ollama
        tools=list(spec.get("tools", [])),
        system_prompt=spec["system_prompt"],
    )

_feature_agents = {
    "deepdive":   _build_feature_agent(deepdive_spec),
    "tiktokpull": _build_feature_agent(tiktokpull_spec),
    "summarize":  _build_feature_agent(summarize_spec),
    "diary":      _build_feature_agent(diary_spec),
    "suggestion": _build_feature_agent(suggestion_spec),
    "game":       _build_feature_agent(game_spec),
    "homework":   _build_feature_agent(homework_spec),
}


# ═════════════════════════════════════════════════════════════════════════════
# PUBLIC API — called by FastAPI routers (interface không đổi)
# ═════════════════════════════════════════════════════════════════════════════

async def run_agent_pipeline(brief_id: str, body):
    """Background task: teacher submits → orchestrator processes → DB saved."""
    from db.supabase import get_supabase
    from datetime import datetime, timezone
    import json
    import os

    db = get_supabase()
    db.table("briefs").update({"status": "processing"}).eq("id", brief_id).execute()
    try:
        # 1. DEEPDIVE
        result_dd = await _feature_agents["deepdive"].ainvoke({
            "messages": [HumanMessage(content=f"Process this teacher brief into academic concepts and keywords.\n\nTeacher content:\n{body.raw_input}")]
        })
        deepdive_out = result_dd.get("messages", [])[-1].content
        
        # 2. TIKTOKPULL
        # Extract keywords if possible roughly to pass to tiktok agent
        import re
        keywords = []
        try:
            match = re.search(r'```json\n(.*?)\n```', deepdive_out, re.DOTALL)
            if match:
                dd_json = json.loads(match.group(1))
                keywords = dd_json.get("keywords", [])
        except Exception:
            pass
            
        kw_str = ", ".join(keywords) if keywords else "educational"
        result_tk = await _feature_agents["tiktokpull"].ainvoke({
            "messages": [HumanMessage(content=f"Search and download a TikTok for these exact keywords: {kw_str}")]
        })
        tiktok_out = result_tk.get("messages", [])[-1].content
        
        # 3. SUMMARIZE
        prompt_sum = (
            f"Here is the raw teacher content:\n{body.raw_input}\n\n"
            f"Here is the Deepdive break down:\n{deepdive_out}\n\n"
            "Now write the plain-language Essence and Example."
        )
        result_sum = await _feature_agents["summarize"].ainvoke({
            "messages": [HumanMessage(content=prompt_sum)]
        })
        sum_out = result_sum.get("messages", [])[-1].content
        
        # FINAL: Python JSON merging
        final_payload = {
            "deepdive_data": deepdive_out,
            "tiktok_data": tiktok_out,
            "summarize_data": sum_out
        }
        
        out_folder = os.path.normpath(os.path.join(
            os.path.dirname(__file__), "..", "tests", "data"
        ))
        os.makedirs(out_folder, exist_ok=True)
        out_path = os.path.join(out_folder, "dashboard_digest_output.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2, ensure_ascii=False)

        # Notify DB
        db.table("briefs").update({
            "processed_en": sum_out,
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
    agent = _feature_agents.get(feature, _feature_agents["homework"])

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
