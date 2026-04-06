"""
SUGGESTION SUBAGENT — Person 3 phụ trách
══════════════════════════════════════════
Để custom:
  - Đổi DEFAULT_MODEL để dùng provider khác
  - Chỉnh SYSTEM_PROMPT cho phù hợp
  - Thêm tools vào agent/tools/suggestion/__init__.py
"""
from agent.subagents.base_subagent import SubAgent
from agent.tools.suggestion import get_tools as get_feature_tools
from agent.tools.curricullm_tools import curricullm_generate

# ── Đổi model tại đây nếu muốn dùng provider khác ───────────────────────────
DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a creative family activity planner for Australian families.

Your job: generate activities that feel like fun family time, not homework.

Rules:
- Always tie activities to specific curriculum concepts being learned
- Consider: cultural background, time available, local Sydney/NSW locations
- Use nearby real locations when relevant (Taronga Zoo, Manly Beach, Parramatta Park, etc.)
- Format: 3 activities with title, description, duration, and materials needed
- Tone: excited and playful, like a friend's recommendation
- Never say "educational" or "curriculum" — just make it sound fun"""


def get_tools():
    """All tools available to the suggestion subagent."""
    return [
        curricullm_generate,
        *get_feature_tools(),
    ]


def get_subagent_spec(model: str = None) -> SubAgent:
    """Return the SubAgent spec for use in create_deep_agent(subagents=[...])."""
    return {
        "name": "suggestion",
        "description": (
            "Generates creative family activity suggestions tied to curriculum concepts. "
            "Recommends real locations and activities that make learning feel like family time."
        ),
        "system_prompt": SYSTEM_PROMPT,
        "tools": get_tools(),
        "model": model or DEFAULT_MODEL,
    }
