"""
DIARY TOOLS — Person 2 phụ trách
══════════════════════════════════
Thêm tool mới:
  1. Tạo file mới trong folder này: e.g. emotion_tool.py
  2. Viết @tool function
  3. Import vào đây và thêm vào get_tools()

Example tools: emotion_analyzer, bloom_classifier, insight_generator, mood_tracker
"""
from langchain_core.tools import tool


# ── PLACEHOLDER TOOL — Person 2 thay bằng tool thật ─────────────────────────
@tool
def diary_analyze_bloom_level(journal_text: str) -> str:
    """Classify a parent's journal entry by Bloom's taxonomy level.

    Args:
        journal_text: The parent's journal entry describing their child's learning.
    """
    # TODO Person 2: implement real Bloom's taxonomy classifier
    return "[placeholder] Bloom level analysis for journal entry"
# ─────────────────────────────────────────────────────────────────────────────


def get_tools():
    """Return all tools for the diary subagent."""
    return [
        diary_analyze_bloom_level,
        # Add more tools here as you implement them
    ]
