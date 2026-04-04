import os, httpx
from agent.tools.base import BaseTool, ToolRegistry, ToolExecutionError


class CurricuLLMGenerateTool(BaseTool):
    name = "curricullm_generate"
    description = """
    Generate educational content using CurricuLLM API.
    Use this to simplify curriculum language, create parent-friendly summaries,
    generate at-home activities, or answer curriculum questions.
    Curriculum-aware for Australian/NZ schools.
    """

    def get_parameters_schema(self):
        return {
            "type": "object",
            "properties": {
                "prompt": {"type": "string"},
                "year_level": {"type": "string"},
                "subject": {"type": "string"},
                "output_format": {
                    "type": "string",
                    "enum": ["text", "json", "activities_list"]
                }
            },
            "required": ["prompt"]
        }

    async def execute(self, prompt: str, year_level: str = None,
                      subject: str = None, output_format: str = "text") -> dict:
        payload = {
            "model": "CurricuLLM-AU",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1500,
            "temperature": 0.7,
        }
        if year_level or subject:
            payload["curriculum"] = {"stage": year_level or "", "subject": subject or ""}
        if output_format == "json":
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{os.getenv('CURRICULLM_BASE_URL')}/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.getenv('CURRICULLM_API_KEY')}"},
                json=payload
            )
        if resp.status_code != 200:
            raise ToolExecutionError(f"CurricuLLM error: {resp.text}")
        content = resp.json()["choices"][0]["message"]["content"]
        return {"content": content, "format": output_format}


ToolRegistry.register(CurricuLLMGenerateTool())
