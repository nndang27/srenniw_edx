"""
Test agent summarize của Person 1 — chạy trực tiếp như run_test_agent.py

Cách chạy:
    cd backend
    python -m agent.run_summarize_agent
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ── Dev: dùng Ollama làm mock CurricuLLM khi chưa có API key thật ───────────
os.environ.setdefault("CURRICULLM_BASE_URL", "http://localhost:11434")
os.environ.setdefault("CURRICULLM_API_KEY", "ollama")
os.environ.setdefault("CURRICULLM_MODEL", "minimax-m2.5:cloud")

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from agent.core.graph import create_deep_agent         # ← core/graph.py
from agent.subagents.summarize_agent import SYSTEM_PROMPT, get_tools

# ── Model: dùng Ollama minimax-m2.5:cloud (thay bằng provider khác nếu muốn) ──
model = ChatOpenAI(
    model="minimax-m2.5:cloud",
    base_url="http://localhost:11434/v1",
    api_key="ollama",
    temperature=0.7,
)

# ── Agent: tạo bằng create_deep_agent từ core/graph.py ──────────────────────
agent = create_deep_agent(
    model=model,
    tools=get_tools(),
    system_prompt=SYSTEM_PROMPT,
    subagents=[],
)

# ── Input: teacher brief thật cho Year 3 Maths ──────────────────────────────
TEACHER_BRIEF = """\
brief_id: brief-test-001 | class_id: class-test-001
Subject: Mathematics | Year Level: Year 3

Teacher note:
This week students explore unit fractions — 1/2, 1/4, 1/3, 1/5.
They use fraction tiles and paper folding to partition shapes into equal parts.
Students link written notation (e.g. 3/4) to physical models.
Assessment via observation and a short written task.
"""


async def main():
    result = await agent.ainvoke({ 
        "messages": [HumanMessage(content=TEACHER_BRIEF)]
    })
    # print(result)
    messages = result.get("messages", [])

    # print(f"\n[THREAD] {len(messages)} messages trong conversation:")
    # for i, m in enumerate(messages):
    #     role = type(m).__name__
    #     tcs = getattr(m, "tool_calls", [])
    #     tc_str = f" → tools={[tc['name'] for tc in tcs]}" if tcs else ""
    #     preview = m.content[:80] if isinstance(m.content, str) else str(m.content)[:80]
    #     print(f"  [{i}] {role}{tc_str}: {preview}")

    # print("\n" + "="*60)
    # print("  OUTPUT cho phụ huynh:")
    # print("="*60)
    final = messages[-1].content if messages else "(empty)"
    print(final)
    # print("="*60 + "\n")



if __name__ == "__main__":
    asyncio.run(main())
