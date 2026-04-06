"""
SUMMARIZE TOOLS — Person 1 phụ trách
═════════════════════════════════════
Thêm tool mới:
  1. Tạo file mới trong folder này: e.g. youtube_tool.py
  2. Viết @tool function, tên bắt đầu bằng "summarize_" (không bắt buộc nhưng gợi ý)
  3. Import vào đây và thêm vào get_tools()

Example tools: tiktok_search, youtube_search, image_finder, curriculum_lookup
"""
from langchain_core.tools import tool


# ── PLACEHOLDER TOOL — Person 1 thay bằng tool thật ─────────────────────────
@tool
def summarize_search_related_content(topic: str, year_level: str = "") -> str:
    """Search for educational content related to a curriculum topic.

    Args:
        topic: The curriculum concept or topic to search for.
        year_level: Optional year level to filter results (e.g. "Year 3").
    """
    # TODO Person 1: implement real search (YouTube, TikTok, etc.)
    return f"[placeholder] Related content for '{topic}' at {year_level}"
# ─────────────────────────────────────────────────────────────────────────────


def get_tools():
    """Return all tools for the summarize subagent."""
    return [
        summarize_search_related_content,
        # Add more tools here as you implement them
    ]
