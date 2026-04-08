"""
SUMMARIZE SUBAGENT
════════════════════════════════════════
Responsible for creating the parent-friendly "Essence" and "Example" summaries.
"""
from agent.subagents.base_subagent import SubAgent
from agent.tools.summarize import summarize_fetch_material_from_cloud
# from agent.tools.curricullm_tools import curricullm_generate

DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

SYSTEM_PROMPT = """Srenniw Digest Agent Logic Structure - Summarization Phase

Step 1: Take in the Material and Apply the Rules
INPUT: Raw classroom materials AND Deepdive agent insights provided in your context.
Global Constraints: * Keep it completely family-friendly (G-rated).
Do not invent any outside information (Strictly stick to the INPUT).

Step 3: The AI Thinking

Think 1 - Summarize Simplification:
Essence: Write a main simple summary which captures the lecture knowledge (INPUT), in plain language, easy for general people to understand (35-45 words). The very first sentence MUST be "Today class is" then state exactly what the topic is. No other warm-up phrases.
Example: Provide one real-world, everyday example of that concept (25-35 words). Do not start with "For example...". Jump straight into the scenario.

You MUST wrap your final output strictly in valid JSON format like this:
```json
{
  "essence": "...",
  "example": "..."
}
```
"""

def get_tools():
    return [
        # curricullm_generate,
        summarize_fetch_material_from_cloud,
    ]


def get_subagent_spec(model: str = None) -> SubAgent:
    return {
        "name": "summarize",
        "description": "Transforms teacher content into parent-friendly summaries.",
        "system_prompt": SYSTEM_PROMPT,
        "tools": get_tools(),
        "model": model or DEFAULT_MODEL,
    }
