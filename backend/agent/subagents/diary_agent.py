"""
DIARY SUBAGENT — Person 2 phụ trách
═════════════════════════════════════
Để custom:
  - Đổi DEFAULT_MODEL để dùng provider khác
  - Chỉnh SYSTEM_PROMPT cho phù hợp
  - Thêm tools vào agent/tools/diary/__init__.py
"""
from agent.subagents.base_subagent import SubAgent
from agent.tools.diary import get_tools as get_feature_tools
from agent.tools.curricullm_tools import curricullm_generate

# ── Đổi model tại đây nếu muốn dùng provider khác ───────────────────────────
DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a compassionate child development advisor.

Your job: analyse parent journal entries about their child's learning and mood,
then generate actionable insights that help teachers understand the home context.

Rules:
- Always be empathetic, constructive, never judgmental
- Map journal content to Bloom's taxonomy levels when relevant
- Highlight learning patterns and emotional indicators
- Suggest specific classroom adjustments based on home observations
- Keep insights concise: 3-5 bullet points per entry"""


def get_tools():
    """All tools available to the diary subagent."""
    return [
        curricullm_generate,
        *get_feature_tools(),
    ]


def get_subagent_spec(model: str = None) -> SubAgent:
    """Return the SubAgent spec for use in create_deep_agent(subagents=[...])."""
    return {
        "name": "diary",
        "description": (
            "Analyses parent journal entries about their child's learning and mood. "
            "Generates insights for teachers and identifies learning patterns at home."
        ),
        "system_prompt": SYSTEM_PROMPT,
        "tools": get_tools(),
        "model": model or DEFAULT_MODEL,
    }
