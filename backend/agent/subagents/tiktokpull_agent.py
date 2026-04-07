"""
TIKTOKPULL SUBAGENT
════════════════════════════════════════
Responsible exclusively for tool-calling: fetching highly visual
TikTok videos based on keywords.
"""
from agent.subagents.base_subagent import SubAgent
from agent.tools.summarize import summarize_search_tiktok, summarize_download_tiktok

DEFAULT_MODEL = "anthropic:claude-sonnet-4-6"

SYSTEM_PROMPT = """Srenniw Digest Agent Logic Structure - Media Intake Phase

Your ONLY job is to take the Video Keywords provided in your context, search for an educational TikTok, and download it.

AFTER receiving the keywords, YOU MUST:
1. Search for a relevant educational TikTok using summarize_search_tiktok based on the visual keywords.
2. If a video is found, download it using summarize_download_tiktok.
3. Return the downloaded file path and the video metadata as your final response. 

Output format MUST be strictly JSON:
```json
{
    "video_local_path": "...",
    "video_metadata": { "author": "...", "desc": "...", "likes": 0, "views": 0 }
}
```
"""

def get_tools():
    return [
        summarize_search_tiktok,
        summarize_download_tiktok,
    ]

def get_subagent_spec(model: str = None) -> SubAgent:
    return {
        "name": "tiktokpull",
        "description": "Searches and downloads Tiktok videos based on provided keywords.",
        "system_prompt": SYSTEM_PROMPT,
        "tools": get_tools(),
        "model": model or DEFAULT_MODEL,
    }
