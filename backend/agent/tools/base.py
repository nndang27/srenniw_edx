"""
TOOL BASE
=========
Dùng LangChain @tool decorator — không cần định nghĩa schema thủ công,
LangChain tự generate từ type hints và docstring.

CÁCH THÊM TOOL MỚI (ví dụ Person 1 — Summarize):
──────────────────────────────────────────────────
1. Tạo file: backend/agent/tools/summarize/my_tool.py
2. Viết hàm với @tool decorator:

   from langchain_core.tools import tool

   @tool
   def summarize_search_curriculum(subject: str, year_level: str) -> str:
       \"\"\"Search Australian curriculum for a subject and year level.\"\"\"
       # ... implementation ...
       return result

3. Export trong backend/agent/tools/summarize/__init__.py:

   from .my_tool import summarize_search_curriculum

   def get_tools():
       return [summarize_search_curriculum]

Tool sẽ tự động có trong summarize subagent.

SHARED TOOLS (tất cả subagent đều dùng được):
  - curricullm_generate    (agent/tools/curricullm_tools.py)
  - db_get_parent_profiles (agent/tools/supabase_tools.py)
  - db_save_brief          (agent/tools/supabase_tools.py)
  - db_send_notifications  (agent/tools/supabase_tools.py)
"""

# Re-export for convenience — teammates import từ đây
from langchain_core.tools import BaseTool, tool  # noqa: F401

__all__ = ["tool", "BaseTool"]
