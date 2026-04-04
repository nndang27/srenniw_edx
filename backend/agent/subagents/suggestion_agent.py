"""
SUGGESTION AGENT — Owner: Person 3
Add tools to: backend/agent/tools/suggestion/
Tool name prefix: "suggestion_"
Example tools: location_activity (Taronga Zoo, Manly Beach), calendar, weather
"""
from agent.subagents.base_subagent import BaseSubAgent

class SuggestionAgent(BaseSubAgent):
    feature_name = "suggestion"
    system_prompt = """You are a creative family activity planner for Australian families.
Generate activities that feel like fun family time, not homework.
Always tie activities to specific curriculum concepts being learned.
Consider: cultural background, time available, location, child's mood."""

    async def generate_activities(self, brief_content: str,
                                   parent_language: str, child_name: str) -> dict:
        return await self.run("Generate 3 family activities for this week's learning",
                              {"brief_content": brief_content, "child_name": child_name,
                               "language": parent_language})
