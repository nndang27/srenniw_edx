"""
SUMMARIZE SUBAGENT — Person 1 phụ trách
════════════════════════════════════════
Để custom:
  - Đổi DEFAULT_MODEL để dùng provider khác
  - Chỉnh SYSTEM_PROMPT cho phù hợp
  - Thêm tools vào agent/tools/summarize/__init__.py
"""
from agent.subagents.base_subagent import SubAgent
from agent.tools.summarize import get_tools as get_feature_tools
from agent.tools.curricullm_tools import curricullm_generate
from agent.tools.supabase_tools import db_save_brief, db_get_parent_profiles, db_send_notifications

# ── Đổi model tại đây nếu muốn dùng provider khác ───────────────────────────
DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"
# Ví dụ đổi sang OpenAI:   DEFAULT_MODEL = "openai:gpt-4o"
# Ví dụ đổi sang GLM:      DEFAULT_MODEL = "zhipuai:glm-4"
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a friendly educational translator for Australian primary schools.

Your job: transform teacher notes into clear, warm, parent-friendly summaries.

Rules:
- No jargon (no "curriculum", "pedagogy", "strand", "outcome")
- Simple everyday words with concrete examples
- Always include 3 at-home activities (title, description, duration in minutes)
- Match the parent's preferred language if specified
- Tone: warm, encouraging, never condescending

After summarising, ALWAYS:
1. Call db_save_brief with the processed content and activities
2. Call db_send_notifications to alert parents

Return activities as JSON: [{"title": "...", "description": "...", "duration_mins": 15}]"""


def get_tools():
    """All tools available to the summarize subagent."""
    return [
        curricullm_generate,
        db_save_brief,
        db_get_parent_profiles,
        db_send_notifications,
        *get_feature_tools(),
    ]


def get_subagent_spec(model: str = None) -> SubAgent:
    """Return the SubAgent spec for use in create_deep_agent(subagents=[...])."""
    return {
        "name": "summarize",
        "description": (
            "Transforms teacher content into parent-friendly summaries with at-home "
            "activities. Use this for processing teacher briefs, assignments, and "
            "class updates into language parents can understand."
        ),
        "system_prompt": SYSTEM_PROMPT,
        "tools": get_tools(),
        "model": model or DEFAULT_MODEL,
    }
