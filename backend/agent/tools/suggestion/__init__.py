"""
SUGGESTION TOOLS — Person 3 phụ trách
═══════════════════════════════════════
Thêm tool mới:
  1. Tạo file mới trong folder này: e.g. location_tool.py
  2. Viết @tool function
  3. Import vào đây và thêm vào get_tools()

Example tools: nearby_locations (Taronga Zoo, Manly Beach), calendar_checker,
               weather_lookup, cultural_activity_finder
"""
from langchain_core.tools import tool


# ── PLACEHOLDER TOOL — Person 3 thay bằng tool thật ─────────────────────────
@tool
def suggestion_find_nearby_activities(
    suburb: str,
    subject: str,
    year_level: str = "",
) -> str:
    """Find nearby family-friendly educational activities related to curriculum.

    Args:
        suburb: Sydney suburb or area for location-based recommendations.
        subject: Curriculum subject to tie the activity to.
        year_level: Child's year level for age-appropriate suggestions.
    """
    # TODO Person 3: implement real location/activity search
    return f"[placeholder] Activities near {suburb} for {subject}"
# ─────────────────────────────────────────────────────────────────────────────


def get_tools():
    """Return all tools for the suggestion subagent."""
    return [
        suggestion_find_nearby_activities,
        # Add more tools here as you implement them
    ]
