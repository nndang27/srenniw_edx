"""
DEEPDIVE SUBAGENT
════════════════════════════════════════
Responsible for parsing the lecture material for core academic concepts,
vocabulary, why it matters, and generating video search keywords.
"""
from agent.subagents.base_subagent import SubAgent

DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

SYSTEM_PROMPT = """Srenniw Digest Agent Logic Structure - Deep Dive Phase

Step 1: Take in the Material and Apply the Rules
INPUT: Raw classroom materials (teacher slides, reading assignments, etc.) provided in your context.
Global Constraints: * Keep it completely family-friendly (G-rated).
Do not invent any outside information (Strictly stick to the INPUT).

Step 3: The AI Thinking (Deep Dive & Video Keywords)

Think 2 - Deep Dive: Break down the lecture knowledge (INPUT).
Core Concept: explain the topic in a detailed academic tone. (Limit: 40-60 words). Use formal academic language. Start directly with the definition.
Key Vocabulary: Exactly 2 to 4 important terms. (15-25 words each). Must physically exist in the INPUT text. Make definitions standalone.
Why This Matters: practical use case outside the classroom. (Limit: 40-60 words).

Think 3 - Pick TikTok Video Search Keywords:
Scan the lecture knowledge (INPUT) to generate highly targeted search queries designed to find educational TikTok videos, mini-lectures, or visual tutorials related to the `{topic}`. 
* Formula: Combine a specific concept from the INPUT + the lecture topic + a platform-native educational modifier (e.g., "tutorial", "explained", "visualized", "hack", "step by step").
* Limit: 1 to 2 short phrases. Strictly 3 to 6 words long. 
* Constraint: Strip overly academic jargon. Formulate the phrase exactly as a student would type it into the TikTok search bar to learn the subject.
* Example: If the lecture topic is "Basic Math", an output should look like "addition math tutorial" or "how to solve addition".

You MUST wrap your final output strictly in valid JSON format containing exactly these keys:
```json
{
  "core_concept": "...",
  "key_vocabulary": [{"term": "...", "definition": "..."}],
  "why_this_matters": "...",
  "keywords": ["..."]
}
```
"""

def get_tools():
    return []

def get_subagent_spec(model: str = None) -> SubAgent:
    return {
        "name": "deepdive",
        "description": "Breaks down lecture material into academic parts and extracts vocabulary.",
        "system_prompt": SYSTEM_PROMPT,
        "tools": get_tools(),
        "model": model or DEFAULT_MODEL,
    }
