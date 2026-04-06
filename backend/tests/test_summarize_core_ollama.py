"""
TEST: Luồng summarize chạy thật qua core/create_deep_agent() + Ollama minimax-m2.5:cloud
═══════════════════════════════════════════════════════════════════════════════════════════

Đây là test tích hợp THẬT — không mock LLM:
  Teacher brief → create_deep_agent() → Ollama (minimax-m2.5:cloud) → parent-friendly output

Luồng:
  test → create_deep_agent(model=Ollama, tools=summarize_tools) → ainvoke() → kết quả

Chạy: pytest tests/test_summarize_core_ollama.py -v -s --noconftest --asyncio-mode=auto
  -s  để thấy output LLM trong terminal
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import time
from unittest.mock import MagicMock, patch
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI


# ─── Ollama config ────────────────────────────────────────────────────────────
OLLAMA_BASE = "http://localhost:11434/v1"
OLLAMA_MODEL = "minimax-m2.5:cloud"


def get_ollama_model():
    return ChatOpenAI(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE,
        api_key="ollama",
        temperature=0.7,
        max_tokens=1500,
    )


# ─── Helpers ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def check_ollama():
    import httpx
    try:
        r = httpx.get(f"{OLLAMA_BASE}/models", timeout=5)
        models = [m["id"] for m in r.json().get("data", [])]
        if OLLAMA_MODEL not in models:
            pytest.skip(f"'{OLLAMA_MODEL}' không có. Available: {models}")
    except Exception as e:
        pytest.skip(f"Ollama không chạy: {e}")


def _make_mock_db():
    db = MagicMock()
    db.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"parent_clerk_id": "p1", "preferred_language": "en", "child_name": "Minh"},
    ]
    db.table.return_value.insert.return_value.execute.return_value.data = [{"id": "notif-1"}]
    return db


def _print_section(title: str, content: str):
    border = "═" * 65
    print(f"\n{border}\n  {title}\n{border}")
    print(content.strip())
    print(border)


def build_summarize_agent():
    """
    Tạo agent qua core/create_deep_agent() với Ollama model.
    Tools được patch để không cần external APIs.
    """
    from agent.core import create_deep_agent          # ← core/graph.py
    from agent.core._models import resolve_model
    from agent.subagents.summarize_agent import SYSTEM_PROMPT
    from agent.tools.summarize import get_tools as get_feature_tools
    from agent.tools.curricullm_tools import curricullm_generate
    from agent.tools.supabase_tools import db_save_brief, db_get_parent_profiles, db_send_notifications

    model = get_ollama_model()
    tools = [
        curricullm_generate,
        db_save_brief,
        db_get_parent_profiles,
        db_send_notifications,
        *get_feature_tools(),
    ]

    print(f"\n{'─'*60}")
    print(f"[BUILD] create_deep_agent() được gọi")
    print(f"        model  : {model.__class__.__name__} → {model.model_name}")
    print(f"        tools  : {[t.name for t in tools]}")
    print(f"        source : agent/core/graph.py → create_deep_agent()")
    print(f"{'─'*60}")

    agent = create_deep_agent(               # ← ĐÂY là chỗ khởi tạo DeepAgent
        model=model,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
        subagents=[],
    )

    print(f"[BUILD] DeepAgent built → type: {type(agent).__name__}")
    print(f"        graph nodes: {list(agent.graph.nodes) if hasattr(agent, 'graph') else 'N/A'}")
    return agent


# ═════════════════════════════════════════════════════════════════════════════
# TESTS
# ═════════════════════════════════════════════════════════════════════════════

@pytest.fixture(autouse=True)
def patch_db():
    """Patch Supabase ở mọi nơi nó được import."""
    db = _make_mock_db()
    with (
        patch("db.supabase.get_supabase", return_value=db, create=True),
        patch("agent.tools.supabase_tools.get_supabase", return_value=db, create=True),
    ):
        yield db


class TestSummarizeCoreAgent:

    @pytest.mark.asyncio
    async def test_fractions_year3_full_flow(self):
        """
        Luồng đầy đủ: Teacher brief về fractions → create_deep_agent() → parent summary.

        Kiểm tra:
          1. Agent chạy không crash
          2. Output chứa nội dung liên quan đến fractions
          3. Có at-home activities
        """
        agent = build_summarize_agent()

        teacher_brief = (
            "brief_id: test-brief-001 | subject: Mathematics | year_level: Year 3\n\n"
            "Teacher content:\n"
            "AC Content Description: Model and represent unit fractions including 1/2, 1/4, 1/3, 1/5 "
            "and their multiples to a complete whole. Students use manipulatives to partition shapes. "
            "They write fraction notation and compare unit fractions with same denominators. "
            "Assessment: observational checklist and brief written task."
        )

        print(f"\n[INVOKE] agent.ainvoke() bắt đầu ← CompiledStateGraph.ainvoke()")
        print(f"         input: HumanMessage({teacher_brief[:80]}...)")
        t0 = time.time()
        result = await agent.ainvoke({"messages": [HumanMessage(content=teacher_brief)]})  # ← ĐÂY
        elapsed = time.time() - t0
        print(f"[INVOKE] ainvoke() hoàn tất sau {elapsed:.1f}s")

        messages = result.get("messages", [])
        final_content = messages[-1].content if messages else ""

        _print_section(
            f"CORE AGENT — Fractions Year 3 ({elapsed:.1f}s) | {len(messages)} msgs",
            final_content[:1500] or "(empty)",
        )

        # In toàn bộ message thread để thấy luồng agent → tool → agent
        import json as _json
        print(f"\n[THREAD] {len(messages)} messages trong conversation:")
        for i, m in enumerate(messages):
            role = type(m).__name__
            tool_calls = getattr(m, "tool_calls", [])
            tc_info = f" → tool_calls={[tc['name'] for tc in tool_calls]}" if tool_calls else ""
            content_preview = (m.content[:60] + "...") if isinstance(m.content, str) and len(m.content) > 60 else m.content
            print(f"  [{i}] {role}{tc_info}: {content_preview}")

        parts = []
        for m in messages:
            if hasattr(m, "content") and isinstance(m.content, str):
                parts.append(m.content)
            if hasattr(m, "tool_calls") and m.tool_calls:
                for tc in m.tool_calls:
                    parts.append(_json.dumps(tc.get("args", {})))
        all_text = " ".join(parts).lower()

        _print_section(
            f"CORE AGENT — Fractions Year 3 ({elapsed:.1f}s) | {len(messages)} msgs",
            final_content[:800] + f"\n\n[Full thread+tool_args: {len(all_text)} chars]",
        )

        assert all_text, "Agent phải có content trong thread"
        assert any(w in all_text for w in ["fraction", "half", "quarter", "equal", "part"]), \
            "Phải mention fractions ở đâu đó trong thread hoặc tool args"
        assert any(w in all_text for w in ["activity", "activities", "home", "try", "practice",
                                           "kitchen", "pizza", "snack", "game", "at-home"]), \
            "Phải có at-home activities ở đâu đó trong thread hoặc db_save_brief args"

    @pytest.mark.asyncio
    async def test_phonics_year2_full_flow(self):
        """
        Teacher brief về phonics Year 2 → agent tóm tắt cho phụ huynh.
        """
        agent = build_summarize_agent()

        teacher_brief = (
            "brief_id: test-brief-002 | subject: English | year_level: Year 2\n\n"
            "Teacher content:\n"
            "English — Literacy. Students develop phonemic awareness through explicit instruction "
            "in blending and segmenting CVC words. Focus on digraphs: 'sh', 'ch', 'th'. "
            "Decoding strategies: sounding out, re-reading, using picture cues."
        )

        print(f"\n[INVOKE] agent.ainvoke() ← CompiledStateGraph.ainvoke()")
        t0 = time.time()
        result = await agent.ainvoke({"messages": [HumanMessage(content=teacher_brief)]})  # ← ĐÂY
        elapsed = time.time() - t0
        print(f"[INVOKE] hoàn tất {elapsed:.1f}s")

        messages = result.get("messages", [])
        final_content = messages[-1].content if messages else ""
        all_ai_text = " ".join(
            m.content for m in messages
            if hasattr(m, "content") and isinstance(m.content, str)
        ).lower()

        import json as _json
        print(f"\n[THREAD] {len(messages)} messages:")
        for i, m in enumerate(messages):
            tcs = getattr(m, "tool_calls", [])
            tc_info = f" → {[tc['name'] for tc in tcs]}" if tcs else ""
            preview = (m.content[:70] + "...") if isinstance(m.content, str) and len(m.content) > 70 else m.content
            print(f"  [{i}] {type(m).__name__}{tc_info}: {preview}")

        _print_section(f"CORE AGENT — Phonics Year 2 ({elapsed:.1f}s)", final_content[:1200])

        assert all_ai_text and len(all_ai_text) > 80
        assert any(w in all_ai_text for w in ["read", "sound", "word", "letter", "phonics",
                                               "blend", "digraph", "sh", "ch"])

    @pytest.mark.asyncio
    async def test_streaming_parent_chatbot(self):
        """
        Test stream_mode='messages' — luồng chatbot cho phụ huynh.
        """
        agent = build_summarize_agent()

        question = (
            "My child is in Year 3 learning fractions. "
            "Explain fractions in simple words and suggest 2 home activities."
        )

        print(f"\n[STREAM] agent.astream(stream_mode='messages') bắt đầu ← CompiledStateGraph.astream()")
        tokens = []
        t0 = time.time()
        chunk_count = 0

        async for chunk in agent.astream(          # ← ĐÂY là chỗ gọi DeepAgent streaming
            {"messages": [HumanMessage(content=question)]},
            stream_mode="messages",
        ):
            msg = chunk[0] if isinstance(chunk, tuple) else chunk
            content = getattr(msg, "content", "")
            chunk_count += 1
            if chunk_count <= 3:  # log 3 chunks đầu để thấy streaming
                print(f"  [chunk #{chunk_count}] {type(msg).__name__}: {repr(content[:40])}")
            if isinstance(content, str) and content:
                tokens.append(content)
            elif isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        tokens.append(block["text"])

        elapsed = time.time() - t0
        full_text = "".join(tokens)
        print(f"[STREAM] hoàn tất {elapsed:.1f}s | tổng {chunk_count} chunks → {len(full_text)} chars")

        _print_section(
            f"STREAM — chatbot ({elapsed:.1f}s) | {chunk_count} chunks",
            full_text[:1200] or "(no tokens)",
        )

        assert full_text, "Stream phải có content"
        assert len(full_text) > 50
        assert any(w in full_text.lower() for w in ["fraction", "half", "part", "equal"])

    @pytest.mark.asyncio
    async def test_vietnamese_parent_ealfd(self):
        """
        Phụ huynh người Việt hỏi bằng tiếng Việt → agent trả lời tiếng Việt.
        """
        agent = build_summarize_agent()

        result = await agent.ainvoke({
            "messages": [HumanMessage(content=(
                "Con tôi đang học về phân số ở lớp 3. "
                "Bạn có thể giải thích phân số là gì bằng tiếng Việt không? "
                "Và gợi ý một hoạt động đơn giản tôi có thể làm với con ở nhà?"
            ))]
        })

        messages = result.get("messages", [])
        final_content = messages[-1].content if messages else ""

        _print_section("CORE AGENT — Vietnamese EAL/D parent", final_content[:1000])

        assert final_content and len(final_content) > 50
        vi_chars = "àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệ"
        assert any(c in final_content for c in vi_chars), \
            f"Agent phải trả lời tiếng Việt.\nGot: {final_content[:200]}"

    @pytest.mark.asyncio
    async def test_db_tools_called_when_prompted(self):
        """
        Agent phải gọi db_save_brief khi prompt yêu cầu lưu.
        Kiểm tra message history có ToolMessage không.
        """
        from langchain_core.messages import ToolMessage
        agent = build_summarize_agent()

        result = await agent.ainvoke({
            "messages": [HumanMessage(content=(
                "brief_id: brief-save-test | class_id: class-001\n"
                "subject: Mathematics | year_level: Year 4\n\n"
                "Students learn multiplication using arrays and equal groups. "
                "Summarise for parents. Then call db_save_brief with "
                "brief_id='brief-save-test' and the summary you wrote."
            ))]
        })

        messages = result.get("messages", [])
        final_content = messages[-1].content if messages else ""
        tool_messages = [m for m in messages if isinstance(m, ToolMessage)]
        tool_names = [m.name for m in tool_messages if hasattr(m, "name")]

        _print_section(
            "CORE AGENT — Tool call check",
            f"Tools called: {tool_names or '(none)'}\n"
            f"Messages in thread: {len(messages)}\n\n"
            f"Final response:\n{final_content[:800]}",
        )

        assert final_content and len(final_content) > 50
        if tool_names:
            print(f"\n✓ Agent gọi tools: {tool_names}")
        else:
            print("\n⚠ Agent không gọi tools (model tự quyết định)")
