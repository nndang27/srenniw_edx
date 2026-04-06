"""
CurricuLLM shared tools — available to ALL subagents.
Swap CURRICULLM_BASE_URL in .env to point at the real API.
"""
import os
import httpx
from langchain_core.tools import tool


@tool
async def curricullm_generate(
    prompt: str,
    year_level: str = "",
    subject: str = "",
    output_format: str = "text",
) -> str:
    """Generate educational content using CurricuLLM API.

    Use this to simplify curriculum language, create parent-friendly summaries,
    generate at-home activities, or answer curriculum questions.
    Curriculum-aware for Australian/NZ schools.

    Args:
        prompt: The generation instruction or question.
        year_level: Australian curriculum year level (e.g. "Year 3").
        subject: Subject area (e.g. "Mathematics", "English").
        output_format: "text", "json", or "activities_list".
    """
    payload: dict = {
        "model": os.getenv("CURRICULLM_MODEL", "CurricuLLM-AU"),
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1500,
        "temperature": 0.7,
    }
    if year_level or subject:
        payload["curriculum"] = {"stage": year_level, "subject": subject}
    if output_format == "json":
        payload["response_format"] = {"type": "json_object"}

    base_url = os.getenv("CURRICULLM_BASE_URL")
    if not base_url:
        return f"[CurricuLLM not configured — set CURRICULLM_BASE_URL. Prompt was: {prompt[:100]}]"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {os.getenv('CURRICULLM_API_KEY', 'dev')}"},
            json=payload,
        )
    if resp.status_code != 200:
        return f"[CurricuLLM error {resp.status_code}]: {resp.text}"
    return resp.json()["choices"][0]["message"]["content"]


# All curricullm tools — add more here as needed
def get_shared_curricullm_tools():
    return [curricullm_generate]
