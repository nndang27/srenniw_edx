"""
SUMMARIZE AGENT — Owner: Person 1
Add tools to: backend/agent/tools/summarize/
Tool name prefix: "summarize_"
Example tools: tiktok_search, youtube_search, image_finder
"""
from agent.subagents.base_subagent import BaseSubAgent

class SummarizeAgent(BaseSubAgent):
    feature_name = "summarize"
    system_prompt = """You are a friendly educational translator for Australian primary schools.
Transform teacher notes into clear, warm, parent-friendly summaries.
Rules: no jargon (curriculum/pedagogy/strand), simple words, concrete examples.
Always include 3 at-home activities with duration. Match parent's preferred language.
Format activities as a JSON array: [{title, description, duration_mins}]"""

    async def process_brief(self, raw_input: str, subject: str,
                             year_level: str, class_id: str, brief_id: str) -> dict:
        return await self.run(raw_input, {"subject": subject, "year_level": year_level,
                                          "class_id": class_id, "brief_id": brief_id})
