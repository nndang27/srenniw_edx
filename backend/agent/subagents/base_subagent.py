"""
SUBAGENT BASE
═════════════
Mỗi subagent là một SubAgent TypedDict được truyền vào create_deep_agent().
SubAgent chạy qua core/graph.py — không cần code loop thủ công nữa.

CÁCH DÙNG:
  Mỗi feature module export 2 thứ:
    - get_tools() → list[BaseTool]          # tools của feature đó
    - get_subagent_spec(model) → SubAgent   # spec truyền vào pipeline

  Để đổi model cho feature của bạn, chỉ cần đổi DEFAULT_MODEL trong file subagent.

SUPPORTED MODELS (xem agent/core/_models.py):
  "anthropic:claude-sonnet-4-6"     → Claude (default)
  "openai:gpt-4o"                   → OpenAI
  "google:gemini-2.0-flash"         → Google Gemini
  "zhipuai:glm-4"                   → ZhipuAI GLM
  "openrouter:meta-llama/llama-3.1" → OpenRouter (mọi provider)
"""
from agent.core.middleware.subagents import SubAgent  # noqa: F401 — re-export for teammates

__all__ = ["SubAgent"]
