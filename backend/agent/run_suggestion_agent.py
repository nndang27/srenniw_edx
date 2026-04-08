"""
Test script for suggestion_agent — run directly like run_summarize_agent.py

How to run:
    cd backend
    python -m agent.run_suggestion_agent
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ── Dev: mock CurricuLLM with local Ollama when no real API key is available ──
os.environ.setdefault("CURRICULLM_BASE_URL", "http://localhost:11434")
os.environ.setdefault("CURRICULLM_API_KEY", "ollama")
os.environ.setdefault("CURRICULLM_MODEL", "minimax-m2.5:cloud")

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from agent.core.graph import create_deep_agent
from agent.subagents.suggestion_agent import SYSTEM_PROMPT, get_tools

# ── Model: Ollama minimax-m2.5:cloud (swap for another provider if needed) ────
model = ChatOpenAI(
    model="minimax-m2.5:cloud",
    base_url="http://localhost:11434/v1",
    api_key="ollama",
    temperature=0.3,
)

# ── Agent: built with create_deep_agent from core/graph.py ───────────────────
agent = create_deep_agent(
    model=model,
    tools=get_tools(),
    system_prompt=SYSTEM_PROMPT,
    subagents=[],
)

# ── Input: chaotic parent message — matches SUGG-001 in test_suggestion.md ───
PARENT_MESSAGE = """\
parent_clerk_id: user_2abc123XYZtest001 | class_id: null | brief_id: null

Hi! So my daughter had a really rough week. Her teacher said she's been acting out in class \
and not focusing, BUT she did come home very excited about something — I think it was to do \
with those old-timey prisoners that came on boats to Australia? Like convicts or something? \
She kept saying 'they had no choice Mum' which was sweet. ALSO she brought home a maths sheet \
about cutting pizzas into equal pieces — halves and quarters I think? Three quarters of the pizza \
was eaten LOL. And then her teacher mentioned something about equivalent fractions and comparing \
ones with different denominators but honestly that went over my head. Anyway I just want to do \
something fun with her this weekend that ties into what she's been learning. She's in Year 4. \
No class ID sorry, I don't have that.
"""


async def main():
    result = await agent.ainvoke({
        "messages": [HumanMessage(content=PARENT_MESSAGE)]
    })
    messages = result.get("messages", [])

    # Uncomment to debug full message thread:
    # print(f"\n[THREAD] {len(messages)} messages in conversation:")
    # for i, m in enumerate(messages):
    #     role = type(m).__name__
    #     tcs = getattr(m, "tool_calls", [])
    #     tc_str = f" → tools={[tc['name'] for tc in tcs]}" if tcs else ""
    #     preview = m.content[:80] if isinstance(m.content, str) else str(m.content)[:80]
    #     print(f"  [{i}] {role}{tc_str}: {preview}")

    # print("\n" + "="*60)
    # print("  Output for parent:")
    # print("="*60)
    final = messages[-1].content if messages else "(empty)"
    print(final)
    # print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
