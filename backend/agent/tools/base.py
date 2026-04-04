"""
BASE TOOL REGISTRY
==================
Each team member adds their tools following this pattern.
No need to touch any other file — just implement BaseTool and register.

HOW TO ADD A NEW TOOL (example: Person 1 - Summarize):
1. Create file: backend/agent/tools/summarize/my_tool.py
2. Implement class MyTool(BaseTool)
3. Import and register in backend/agent/tools/summarize/__init__.py
4. Tool is automatically available to the summarize_agent
"""

from abc import ABC, abstractmethod
from typing import Optional
import json


class BaseTool(ABC):
    name: str
    description: str

    @abstractmethod
    async def execute(self, **kwargs) -> dict:
        pass

    def to_openai_function(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.get_parameters_schema()
            }
        }

    @abstractmethod
    def get_parameters_schema(self) -> dict:
        pass


class ToolExecutionError(Exception):
    pass


class ToolRegistry:
    _tools: dict[str, BaseTool] = {}

    @classmethod
    def register(cls, tool: BaseTool):
        cls._tools[tool.name] = tool

    @classmethod
    def get(cls, name: str) -> Optional[BaseTool]:
        return cls._tools.get(name)

    @classmethod
    def get_all_for_feature(cls, feature: str) -> list[BaseTool]:
        prefix = f"{feature}_"
        return [t for name, t in cls._tools.items()
                if name.startswith(prefix) or name in SHARED_TOOLS]

    @classmethod
    def to_openai_functions(cls, feature: str = None) -> list[dict]:
        tools = cls.get_all_for_feature(feature) if feature else list(cls._tools.values())
        return [t.to_openai_function() for t in tools]

    @classmethod
    async def execute(cls, tool_name: str, arguments: dict) -> str:
        tool = cls.get(tool_name)
        if not tool:
            return json.dumps({"error": f"Tool not found: {tool_name}"})
        try:
            result = await tool.execute(**arguments)
            return json.dumps(result)
        except ToolExecutionError as e:
            return json.dumps({"error": str(e)})


SHARED_TOOLS = [
    "db_get_parent_profiles",
    "db_save_brief",
    "db_send_notifications",
    "curricullm_generate",
    "translate_content",
]
