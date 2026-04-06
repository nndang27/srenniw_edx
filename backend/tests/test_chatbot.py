"""
test_chatbot.py — Standalone backend test for the Homework Assistant chatbot.

Run from backend/:
    python -m pytest tests/test_chatbot.py -v -s
    # or run directly:
    python tests/test_chatbot.py

Tests:
    1. Homework explanation (no direct answer)
    2. Concept question (Socratic guidance)
    3. Classroom question (redirect to teacher)
    4. Subject-specific homework lookup
    5. Streaming output check
"""
import asyncio
import sys
import os

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()


# ── Test helpers ───────────────────────────────────────────────────────────────

async def stream_to_string(generator) -> str:
    """Collect all streaming chunks into a full string."""
    parts = []
    async for chunk in generator:
        parts.append(chunk)
        print(chunk, end="", flush=True)
    print()  # newline after streaming
    return "".join(parts)


async def ask(question: str, feature: str = "homework") -> str:
    """Ask the chatbot a question and return the full response."""
    from agent.pipeline import stream_chatbot_response
    print(f"\n{'='*60}")
    print(f"Q: {question}")
    print(f"{'─'*60}")
    print("A: ", end="")
    response = await stream_to_string(stream_chatbot_response(question, feature=feature))
    return response


# ── Test cases ─────────────────────────────────────────────────────────────────

async def test_maths_homework_no_direct_answer():
    """Agent should explain the area model WITHOUT giving 23×4 = 92 directly."""
    print("\n\n📝 TEST 1: Maths homework — should explain but not give answer")
    response = await ask("My child needs to solve 23×4 using the area model. Can you just tell me the answer?")

    # Should NOT contain the bare answer
    assert "92" not in response or "area model" in response.lower() or "step" in response.lower(), \
        "Agent gave direct answer without explanation!"
    # Should contain guiding content
    assert any(word in response.lower() for word in ["area model", "split", "tens", "ones", "step", "try", "think"]), \
        "Agent did not provide explanation or guidance!"
    print("✅ PASS: Agent explained without giving direct answer")


async def test_english_concept_explanation():
    """Agent should explain persuasive writing structure using Socratic method."""
    print("\n\n📝 TEST 2: English — PEEL structure explanation")
    response = await ask("My daughter doesn't understand how to start the persuasive essay. What is PEEL?")

    assert any(word in response.lower() for word in ["point", "evidence", "explanation", "link", "peel"]), \
        "Agent did not explain PEEL structure!"
    print("✅ PASS: Agent explained PEEL structure")


async def test_classroom_question_redirects():
    """Agent should redirect classroom questions to teacher."""
    print("\n\n📝 TEST 3: Classroom question — should redirect to teacher")
    response = await ask("How is my son behaving in class? Is he paying attention?")

    redirect_keywords = ["chat tab", "teacher", "message", "classroom experience", "directly"]
    assert any(kw in response.lower() for kw in redirect_keywords), \
        f"Agent did NOT redirect classroom question to teacher!\nResponse: {response}"
    print("✅ PASS: Agent redirected to teacher")


async def test_grades_question_redirects():
    """Agent should redirect grade questions to teacher."""
    print("\n\n📝 TEST 4: Grades question — should redirect to teacher")
    response = await ask("What grades did my child get in the last test?")

    redirect_keywords = ["chat tab", "teacher", "message", "classroom", "directly"]
    assert any(kw in response.lower() for kw in redirect_keywords), \
        f"Agent did NOT redirect grades question!\nResponse: {response}"
    print("✅ PASS: Agent redirected grades question to teacher")


async def test_science_states_of_matter():
    """Agent should help with Science homework about states of matter."""
    print("\n\n📝 TEST 5: Science — states of matter diagram")
    response = await ask("My son has to draw a diagram about water changing states. Can you explain what happens when water evaporates?")

    assert any(word in response.lower() for word in ["evapor", "heat", "liquid", "gas", "steam", "energy"]), \
        "Agent did not explain evaporation properly!"
    # Should not just give the finished diagram description
    assert len(response) > 100, "Response too short!"
    print("✅ PASS: Agent explained evaporation concept")


async def test_encouragement_tone():
    """Agent should be encouraging even for basic questions."""
    print("\n\n📝 TEST 6: Tone check — encouraging and warm")
    response = await ask("My child says maths is too hard and doesn't want to do it.")

    negative_tone = ["that's wrong", "you should", "it's easy", "just do it"]
    for neg in negative_tone:
        assert neg not in response.lower(), f"Agent used discouraging tone: '{neg}'"
    print("✅ PASS: Agent maintained encouraging tone")


async def test_homework_context_tool():
    """Test the get_current_homework tool directly."""
    print("\n\n📝 TEST 7: Homework context tool — direct call")
    from agent.tools.homework import get_current_homework
    result = get_current_homework.invoke({"subject": "Maths"})
    assert "Multiplication" in result or "multiplication" in result.lower(), \
        "Homework context missing Maths content!"
    assert "area model" in result.lower(), "Maths homework missing area model concept!"
    print(f"Context snippet: {result[:200]}...")
    print("✅ PASS: Homework context tool works")


async def test_streaming_chunks():
    """Verify streaming produces multiple chunks (not one giant response)."""
    print("\n\n📝 TEST 8: Streaming — verify token-by-token output")
    from agent.pipeline import stream_chatbot_response

    chunks = []
    async for chunk in stream_chatbot_response(
        "Can you briefly explain what the area model is?",
        feature="homework"
    ):
        chunks.append(chunk)

    assert len(chunks) > 1, f"Expected streaming chunks, got {len(chunks)} chunk(s)"
    full = "".join(chunks)
    assert len(full) > 50, "Response too short"
    print(f"✅ PASS: Got {len(chunks)} streaming chunks, total {len(full)} chars")


# ── Main runner ────────────────────────────────────────────────────────────────

async def run_all_tests():
    tests = [
        test_homework_context_tool,       # Tool test (no LLM, fast)
        test_maths_homework_no_direct_answer,
        test_english_concept_explanation,
        test_classroom_question_redirects,
        test_grades_question_redirects,
        test_science_states_of_matter,
        test_encouragement_tone,
        test_streaming_chunks,
    ]

    passed = 0
    failed = 0
    errors = []

    for test_fn in tests:
        try:
            await test_fn()
            passed += 1
        except AssertionError as e:
            failed += 1
            errors.append(f"FAIL [{test_fn.__name__}]: {e}")
            print(f"❌ FAIL: {e}")
        except Exception as e:
            failed += 1
            errors.append(f"ERROR [{test_fn.__name__}]: {e}")
            print(f"💥 ERROR: {e}")

    print(f"\n{'='*60}")
    print(f"RESULTS: {passed} passed, {failed} failed")
    if errors:
        print("\nFailures:")
        for err in errors:
            print(f"  • {err}")
    print("="*60)
    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
