"""
DIARY AGENT — Owner: Person 2
Add tools to: backend/agent/tools/diary/
Tool name prefix: "diary_"
Example tools: emotion_analyzer, bloom_classifier, insight_generator
"""
from agent.subagents.base_subagent import BaseSubAgent

class DiaryAgent(BaseSubAgent):
    feature_name = "diary"
    system_prompt = """You are a compassionate child development advisor.
Analyze parent journal entries about their child's learning and mood.
Generate insights that help teachers understand what's happening at home.
Always be empathetic, constructive, and never judgmental."""

    async def analyze_journal(self, journal_entry: str, bloom_level: int,
                               mood: str, child_name: str) -> dict:
        return await self.run(journal_entry, {"child_name": child_name,
                                              "bloom_level": bloom_level, "mood": mood})
