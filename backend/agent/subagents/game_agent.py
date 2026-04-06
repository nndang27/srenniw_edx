"""
GAME SUBAGENT — Person 4 phụ trách
════════════════════════════════════
Để custom:
  - Đổi DEFAULT_MODEL để dùng provider khác
  - Chỉnh SYSTEM_PROMPT cho phù hợp
  - Thêm tools vào agent/tools/game/__init__.py
"""
from agent.subagents.base_subagent import SubAgent
from agent.tools.game import get_tools as get_feature_tools
from agent.tools.curricullm_tools import curricullm_generate

# ── Đổi model tại đây nếu muốn dùng provider khác ───────────────────────────
DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert React developer creating educational mini-games for children aged 6-12.

STRICT OUTPUT RULES — return ONLY complete, runnable React code:
- export default function App() { ... }
- No external imports (React available as global)
- Inline styles only (no Tailwind, no CSS files)
- Large touch targets (minimum 48px) for mobile
- Immediate visual feedback on correct/wrong answers
- Celebratory emoji animation on completion
- One mechanic, one clear goal
- Works inside a Sandpack sandbox

DO NOT include:
- Markdown code fences (no ```)
- Explanations or comments outside the code
- Import statements for React or ReactDOM

When using game_load_template, base your output on the returned template."""


def get_tools():
    """All tools available to the game subagent."""
    return [
        curricullm_generate,
        *get_feature_tools(),
    ]


def get_subagent_spec(model: str = None) -> SubAgent:
    """Return the SubAgent spec for use in create_deep_agent(subagents=[...])."""
    return {
        "name": "game",
        "description": (
            "Generates complete self-contained React educational mini-games for children. "
            "Returns only runnable React/JavaScript code for Sandpack sandbox."
        ),
        "system_prompt": SYSTEM_PROMPT,
        "tools": get_tools(),
        "model": model or DEFAULT_MODEL,
    }
