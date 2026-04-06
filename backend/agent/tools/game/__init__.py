"""
GAME TOOLS — Person 4 phụ trách
═════════════════════════════════
Thêm tool mới:
  1. Tạo file mới trong folder này: e.g. template_tool.py
  2. Viết @tool function
  3. Import vào đây và thêm vào get_tools()

Example tools: game_template_loader, animation_generator,
               sound_effects_picker, difficulty_adjuster
"""
from langchain_core.tools import tool


# ── PLACEHOLDER TOOL — Person 4 thay bằng tool thật ─────────────────────────
@tool
def game_load_template(game_type: str, subject: str) -> str:
    """Load a base React game template for a specific game type and subject.

    Args:
        game_type: Type of game (e.g. "quiz", "matching", "drag-drop", "word-search").
        subject: Curriculum subject the game is for (e.g. "Maths", "English").
    """
    # TODO Person 4: implement real template loader
    return f"[placeholder] Game template for {game_type} / {subject}"
# ─────────────────────────────────────────────────────────────────────────────


def get_tools():
    """Return all tools for the game subagent."""
    return [
        game_load_template,
        # Add more tools here as you implement them
    ]
