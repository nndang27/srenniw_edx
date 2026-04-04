"""
⚡ DEEPAGENTS SWAP POINTS (2 locations):
- Replace run()    with graph.invoke()
- Replace stream() with graph.stream()
Everything else stays the same.
"""
from agent.tools.base import ToolRegistry
import os, httpx, json


class BaseSubAgent:
    feature_name: str
    system_prompt: str

    async def run(self, user_input: str, context: dict) -> dict:
        # ⚡ SWAP: replace this method body with graph.invoke()
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": self._build_prompt(user_input, context)}
        ]
        tools = ToolRegistry.to_openai_functions(self.feature_name)
        while True:
            response = await self._call_llm(messages, tools)
            choice = response["choices"][0]
            if choice["finish_reason"] == "stop":
                return {"result": choice["message"]["content"], "feature": self.feature_name}
            if choice["finish_reason"] == "tool_calls":
                tool_calls = choice["message"]["tool_calls"]
                messages.append({"role": "assistant", "tool_calls": tool_calls})
                for tc in tool_calls:
                    args = json.loads(tc["function"]["arguments"])
                    result = await ToolRegistry.execute(tc["function"]["name"], args)
                    messages.append({"role": "tool", "tool_call_id": tc["id"], "content": result})

    async def stream(self, user_input: str, context: dict):
        # ⚡ SWAP: replace this method body with graph.stream()
        result = await self.run(user_input, context)
        for word in result["result"].split(" "):
            yield word + " "

    def _build_prompt(self, user_input: str, context: dict) -> str:
        return f"""Context:
- Child: {context.get('child_name', 'the student')}
- Subject: {context.get('subject', '')}
- Year Level: {context.get('year_level', '')}
- Brief content: {context.get('brief_content', '')}

User request: {user_input}"""

    async def _call_llm(self, messages: list, tools: list) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{os.getenv('CURRICULLM_BASE_URL')}/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.getenv('CURRICULLM_API_KEY')}"},
                json={"model": "CurricuLLM-AU", "messages": messages,
                      "tools": tools if tools else None,
                      "tool_choice": "auto" if tools else None, "max_tokens": 2000}
            )
        return resp.json()
