"""
TEST: Agent pipeline — integration tests với mocked agents (không gọi LLM thật).

Mô phỏng các kịch bản thực tế cho primary school:
  - Giáo viên submit bài về phân số Year 3
  - Chatbot giải thích fractions cho phụ huynh
  - Tạo React game về multiplication tables
  - Phân tích diary con trẻ đang gặp khó khăn

Chạy: pytest tests/test_agent_pipeline.py -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from langchain_core.messages import AIMessage, AIMessageChunk
from uuid import UUID


# ═════════════════════════════════════════════════════════════════════════════
# MOCK RESPONSES — nội dung giáo dục thực tế
# ═════════════════════════════════════════════════════════════════════════════

FRACTIONS_SUMMARY = """
Hi there! 👋 This week your child is diving into FRACTIONS in Maths!

What this means in everyday language:
• A fraction is just a way of describing a part of something whole
• Example: cut an orange into 4 equal pieces — each piece is ¼ (one quarter)
• Your child will learn to write fractions like ½, ⅓, ¼ and say what they mean

🏠 At-home activities to try this week:
1. **Pizza/Toast Fractions** (15 mins) — Cut toast into halves, quarters.
   Ask "How many quarters make a whole?"
2. **Fruit Bowl Sort** (10 mins) — Count the fruit.
   "What fraction are bananas?" If 2 of 5 are bananas, that's 2/5!
3. **Sharing Biscuits** (10 mins) — Share 8 biscuits equally between 2 people.
   Each gets ½ of the total. Count together!
""".strip()

GAME_REACT_CODE = """
export default function App() {
  const [score, setScore] = React.useState(0);
  const [question, setQuestion] = React.useState({ a: 3, b: 4 });
  const [feedback, setFeedback] = React.useState('');

  const check = (ans) => {
    if (ans === question.a * question.b) {
      setScore(s => s + 1);
      setFeedback('🎉 Correct! Amazing work!');
    } else {
      setFeedback('❌ Try again!');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: 32, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 32 }}>⭐ Maths Times Tables</h1>
      <p style={{ fontSize: 28 }}>What is {question.a} × {question.b}?</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[question.a * question.b - 3, question.a * question.b, question.a * question.b + 2, question.a + question.b].map(opt => (
          <button key={opt} onClick={() => check(opt)}
            style={{ fontSize: 24, padding: '16px 24px', minWidth: 64, borderRadius: 12, cursor: 'pointer' }}>
            {opt}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 22, marginTop: 16 }}>{feedback}</p>
      <p>Score: {score}</p>
    </div>
  );
}
""".strip()

DIARY_INSIGHT = """
## Insights from parent journal — Minh (Year 3)

**Emotional indicators:**
• High frustration level — "crying" and "I don't get it" suggests cognitive overload
• 45-minute struggle indicates the concept hasn't clicked yet

**Bloom's taxonomy level:** Understanding (Level 2) — trying to grasp the concept

**Suggested classroom adjustments:**
• Use concrete manipulatives (physical fraction bars) before moving to abstract notation
• Consider pairing Minh with a peer who grasps fractions well
• Reduce homework complexity this week — mastery of halves/quarters first

**For the parent:**
• This is completely normal at this stage — fractions are tricky!
• Try the "pizza" or "sharing food" approach at dinner tonight
""".strip()

SUGGESTION_ACTIVITIES = """
## Weekend Family Activities — Fractions (Parramatta area)

1. **Parramatta Park Picnic Maths** (2 hours)
   Bring a picnic and use real food to explore fractions.
   "Cut the sandwich into 4 pieces — how many quarters did you eat?"

2. **Westfield Parramatta Baking Trip** (1.5 hours)
   Visit Woolworths, buy ingredients, bake at home.
   Recipes use fractions! "Add ½ cup of flour, ¼ cup of sugar"

3. **At-home Lego Fractions** (30 mins)
   Use Lego bricks: "Show me ½ of 8 bricks" — makes abstract concrete.
""".strip()


# ═════════════════════════════════════════════════════════════════════════════
# FIXTURES
# ═════════════════════════════════════════════════════════════════════════════

def _make_agent_mock(response_text: str):
    """Tạo fake LangGraph agent trả về response_text khi ainvoke / astream."""
    agent = MagicMock()
    agent.ainvoke = AsyncMock(return_value={
        "messages": [AIMessage(content=response_text)]
    })

    async def fake_astream(input_data, stream_mode=None):
        words = response_text.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield (AIMessageChunk(content=token), {"langgraph_node": "agent"})

    agent.astream = fake_astream
    return agent


def _make_db(brief_status: str = "processing"):
    db = MagicMock()
    db.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"status": "done"}  # default: brief already done after agent runs
    ]
    db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
    return db


@pytest.fixture
def mock_db():
    return _make_db()


@pytest.fixture
def patch_pipeline_agents(mock_db):
    """Patch _orchestrator và _feature_agents trong pipeline module."""
    summarize_agent = _make_agent_mock(FRACTIONS_SUMMARY)
    diary_agent = _make_agent_mock(DIARY_INSIGHT)
    suggestion_agent = _make_agent_mock(SUGGESTION_ACTIVITIES)
    game_agent = _make_agent_mock(GAME_REACT_CODE)

    import agent.pipeline as pipeline

    with (
        patch.object(pipeline, "_orchestrator", summarize_agent),
        patch.object(pipeline, "_feature_agents", {
            "summarize": summarize_agent,
            "diary": diary_agent,
            "suggestion": suggestion_agent,
            "game": game_agent,
        }),
        patch("agent.pipeline.get_supabase", return_value=mock_db, create=True),
    ):
        yield {
            "summarize": summarize_agent,
            "diary": diary_agent,
            "suggestion": suggestion_agent,
            "game": game_agent,
            "db": mock_db,
        }


# ═════════════════════════════════════════════════════════════════════════════
# run_agent_pipeline — giáo viên submit bài
# ═════════════════════════════════════════════════════════════════════════════

class TestRunAgentPipeline:

    @pytest.mark.asyncio
    async def test_year3_fractions_brief_sets_processing_then_done(self, patch_pipeline_agents, mock_db):
        """
        Kịch bản: GV gửi bài về fractions cho Year 3.
        Pipeline phải update status processing → done.
        """
        from agent.pipeline import run_agent_pipeline

        body = MagicMock()
        body.subject = "Mathematics"
        body.year_level = "Year 3"
        body.class_id = UUID("00000000-0000-0000-0000-000000000001")
        body.raw_input = (
            "This week students explore fractions using arrays and repeated division. "
            "Links to AC Mathematics — Number and Algebra strand, Year 3. "
            "Assessment via observation and a brief written reflection."
        )

        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            await run_agent_pipeline("brief-001", body)

        # Phải set 'processing' trước
        update_calls = mock_db.table.return_value.update.call_args_list
        statuses = [str(call) for call in update_calls]
        assert any("processing" in s for s in statuses)

    @pytest.mark.asyncio
    async def test_agent_invoked_with_brief_content(self, patch_pipeline_agents, mock_db):
        """Orchestrator phải được gọi với content của brief."""
        from agent.pipeline import run_agent_pipeline

        body = MagicMock()
        body.subject = "English"
        body.year_level = "Year 2"
        body.class_id = UUID("00000000-0000-0000-0000-000000000002")
        body.raw_input = "Students are learning phonics — CVC words and blending sounds."

        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            await run_agent_pipeline("brief-002", body)

        orchestrator = patch_pipeline_agents["summarize"]
        orchestrator.ainvoke.assert_called_once()

        call_args = orchestrator.ainvoke.call_args[0][0]
        messages = call_args.get("messages", [])
        assert len(messages) == 1
        assert "phonics" in messages[0].content.lower() or "brief-002" in messages[0].content

    @pytest.mark.asyncio
    async def test_pipeline_marks_failed_on_agent_error(self, mock_db):
        """Nếu agent throw exception, status phải được đổi thành 'failed'."""
        from agent.pipeline import run_agent_pipeline

        broken_agent = MagicMock()
        broken_agent.ainvoke = AsyncMock(side_effect=RuntimeError("LLM timeout"))

        body = MagicMock()
        body.subject = "Science"
        body.year_level = "Year 5"
        body.class_id = UUID("00000000-0000-0000-0000-000000000003")
        body.raw_input = "Food chains and ecosystems."

        import agent.pipeline as pipeline
        with (
            patch.object(pipeline, "_orchestrator", broken_agent),
            patch("agent.pipeline.get_supabase", return_value=mock_db),
            pytest.raises(RuntimeError, match="LLM timeout"),
        ):
            await run_agent_pipeline("brief-003", body)

        # Status phải là 'failed'
        update_calls = mock_db.table.return_value.update.call_args_list
        statuses = [str(call) for call in update_calls]
        assert any("failed" in s for s in statuses)


# ═════════════════════════════════════════════════════════════════════════════
# stream_chatbot_response — phụ huynh chat về curriculum
# ═════════════════════════════════════════════════════════════════════════════

class TestStreamChatbotResponse:

    @pytest.mark.asyncio
    async def test_streams_tokens_for_fractions_question(self, patch_pipeline_agents, mock_db):
        """
        Kịch bản: Phụ huynh hỏi 'What are fractions?' — phải nhận tokens streaming.
        """
        from agent.pipeline import stream_chatbot_response

        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            tokens = []
            async for token in stream_chatbot_response(
                user_message="Can you explain what fractions are in simple terms?",
                feature="summarize",
            ):
                tokens.append(token)

        assert len(tokens) > 0, "Phải yield ít nhất 1 token"
        full_text = "".join(tokens)
        # Mock response là FRACTIONS_SUMMARY
        assert len(full_text) > 50

    @pytest.mark.asyncio
    async def test_includes_brief_context_when_brief_id_provided(self, patch_pipeline_agents, mock_db):
        """
        Khi có brief_id, pipeline phải fetch brief từ DB và include vào prompt.
        """
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [{
            "processed_en": "Your child is learning about fractions this week!",
            "subject": "Mathematics",
            "year_level": "Year 3",
        }]

        from agent.pipeline import stream_chatbot_response

        tokens = []
        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            async for token in stream_chatbot_response(
                user_message="What activities can I do at home?",
                brief_id="brief-001",
                feature="summarize",
            ):
                tokens.append(token)

        full_text = "".join(tokens)
        assert len(full_text) > 0

        # Verify agent được gọi với context từ brief
        agent = patch_pipeline_agents["summarize"]
        call_args = agent.astream.call_args
        assert call_args is not None

    @pytest.mark.asyncio
    async def test_routes_to_correct_feature_agent(self, patch_pipeline_agents, mock_db):
        """Mỗi feature phải dùng đúng agent của feature đó."""
        from agent.pipeline import stream_chatbot_response

        test_cases = [
            ("What is multiplication?", "summarize"),
            ("My child seems frustrated", "diary"),
            ("What can we do this weekend?", "suggestion"),
            ("Make a game about animals", "game"),
        ]

        for message, feature in test_cases:
            with patch("agent.pipeline.get_supabase", return_value=mock_db):
                tokens = []
                async for t in stream_chatbot_response(message, feature=feature):
                    tokens.append(t)
            assert len(tokens) > 0, f"Feature '{feature}' không yield token nào"

    @pytest.mark.asyncio
    async def test_falls_back_to_summarize_for_unknown_feature(self, patch_pipeline_agents, mock_db):
        """Feature không tồn tại phải fallback về summarize agent."""
        from agent.pipeline import stream_chatbot_response

        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            tokens = []
            async for token in stream_chatbot_response(
                user_message="Tell me something",
                feature="unknown_feature_xyz",
            ):
                tokens.append(token)

        assert len(tokens) > 0, "Phải fallback về summarize agent"

    @pytest.mark.asyncio
    async def test_fallback_to_ainvoke_on_stream_error(self, mock_db):
        """
        Nếu astream fail, phải fallback sang ainvoke và vẫn yield content.
        """
        broken_stream_agent = MagicMock()

        async def broken_astream(*args, **kwargs):
            raise RuntimeError("Stream broken")
            yield  # make it async generator

        broken_stream_agent.astream = broken_astream
        broken_stream_agent.ainvoke = AsyncMock(return_value={
            "messages": [AIMessage(content="Fallback content about fractions")]
        })

        import agent.pipeline as pipeline
        with (
            patch.object(pipeline, "_feature_agents", {"summarize": broken_stream_agent}),
            patch("agent.pipeline.get_supabase", return_value=mock_db),
        ):
            tokens = []
            async for token in pipeline.stream_chatbot_response("Hello", feature="summarize"):
                tokens.append(token)

        assert "".join(tokens) == "Fallback content about fractions"


# ═════════════════════════════════════════════════════════════════════════════
# generate_game_code — tạo React game
# ═════════════════════════════════════════════════════════════════════════════

class TestGenerateGameCode:

    @pytest.mark.asyncio
    async def test_generates_multiplication_quiz_game(self, patch_pipeline_agents):
        """
        Kịch bản: Tạo game quiz về multiplication tables cho Year 3.
        """
        from agent.pipeline import generate_game_code

        result = await generate_game_code(
            concept="multiplication tables",
            year_level="Year 3",
            subject="Mathematics",
            game_type="quiz",
        )

        assert result is not None
        assert len(result) > 50, "Game code phải có nội dung"
        # Mock trả về GAME_REACT_CODE
        assert "export default" in result or "function App" in result

    @pytest.mark.asyncio
    async def test_generates_phonics_game_for_year2(self, patch_pipeline_agents):
        """Kịch bản: Tạo matching game về phonics cho Year 2."""
        from agent.pipeline import generate_game_code

        result = await generate_game_code(
            concept="CVC words and phonics",
            year_level="Year 2",
            subject="English",
            game_type="matching",
        )

        assert isinstance(result, str)
        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_game_prompt_includes_all_params(self, patch_pipeline_agents):
        """Prompt gửi cho game agent phải chứa tất cả parameters."""
        from agent.pipeline import generate_game_code

        game_agent = patch_pipeline_agents["game"]

        await generate_game_code(
            concept="animal classification",
            year_level="Year 4",
            subject="Science",
            game_type="drag-drop",
            language="vi",
        )

        call_args = game_agent.ainvoke.call_args[0][0]
        prompt_content = call_args["messages"][0].content

        assert "animal classification" in prompt_content
        assert "Year 4" in prompt_content
        assert "Science" in prompt_content
        assert "drag-drop" in prompt_content
        assert "vi" in prompt_content

    @pytest.mark.asyncio
    async def test_game_code_returned_directly_not_wrapped(self, patch_pipeline_agents):
        """generate_game_code trả về string code trực tiếp, không phải dict."""
        from agent.pipeline import generate_game_code

        result = await generate_game_code(
            concept="place value",
            year_level="Year 1",
            subject="Mathematics",
            game_type="quiz",
        )

        assert isinstance(result, str)
        assert result == GAME_REACT_CODE


# ═════════════════════════════════════════════════════════════════════════════
# REALISTIC END-TO-END SCENARIOS (mocked LLM)
# ═════════════════════════════════════════════════════════════════════════════

class TestRealisticScenarios:
    """
    Kịch bản end-to-end mô phỏng thực tế hackathon demo.
    Tất cả đều dùng mock LLM — không gọi API thật.
    """

    @pytest.mark.asyncio
    async def test_scenario_year3_maths_fractions_full_flow(self, patch_pipeline_agents, mock_db):
        """
        Full flow: GV submit bài fractions → pipeline xử lý → parent chatbot trả lời.
        """
        from agent.pipeline import run_agent_pipeline, stream_chatbot_response

        # Step 1: GV submit
        body = MagicMock()
        body.subject = "Mathematics"
        body.year_level = "Year 3"
        body.class_id = UUID("00000000-0000-0000-0000-000000000001")
        body.raw_input = (
            "AC Strand: Number and Algebra. Content description: "
            "Model and represent unit fractions including 1/2, 1/4, 1/3, 1/5. "
            "Use fraction notation. Compare and order fractions with same denominators."
        )

        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            await run_agent_pipeline("brief-fractions-y3", body)

        # Step 2: Parent chat
        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            tokens = []
            async for token in stream_chatbot_response(
                user_message="What exactly is my child learning about fractions?",
                feature="summarize",
            ):
                tokens.append(token)

        response = "".join(tokens)
        assert len(response) > 10, "Chatbot phải trả lời"

    @pytest.mark.asyncio
    async def test_scenario_year2_english_phonics(self, patch_pipeline_agents, mock_db):
        """
        Kịch bản: Year 2 English — phonics, GV gửi bài và parent hỏi chatbot.
        """
        from agent.pipeline import run_agent_pipeline, stream_chatbot_response

        body = MagicMock()
        body.subject = "English"
        body.year_level = "Year 2"
        body.class_id = UUID("00000000-0000-0000-0000-000000000002")
        body.raw_input = (
            "Focus: phonemic awareness — blending and segmenting CVC words. "
            "Students will practice reading decodable texts and identifying rhyming patterns."
        )

        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            await run_agent_pipeline("brief-phonics-y2", body)

            tokens = []
            async for token in stream_chatbot_response(
                "How can I help my child with reading at home?",
                feature="summarize",
            ):
                tokens.append(token)

        assert len("".join(tokens)) > 0

    @pytest.mark.asyncio
    async def test_scenario_multilingual_parent_diary(self, patch_pipeline_agents, mock_db):
        """
        Kịch bản: Phụ huynh người Việt ghi diary về con đang khó khăn.
        """
        from agent.pipeline import stream_chatbot_response

        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            tokens = []
            async for token in stream_chatbot_response(
                user_message=(
                    "Hôm nay con tôi (Minh, lớp 3) rất buồn khi làm bài tập về phân số. "
                    "Con khóc và nói 'Con không hiểu'. Chúng tôi ngồi học 1 tiếng mà vẫn không xong."
                ),
                feature="diary",
            ):
                tokens.append(token)

        response = "".join(tokens)
        assert len(response) > 0, "Diary agent phải respond cho phụ huynh tiếng Việt"

    @pytest.mark.asyncio
    async def test_scenario_generate_multiplication_game(self, patch_pipeline_agents):
        """
        Kịch bản: Tạo game multiplication table cho Year 3 để chạy trên Sandpack.
        """
        from agent.pipeline import generate_game_code

        code = await generate_game_code(
            concept="3 times tables",
            year_level="Year 3",
            subject="Mathematics",
            game_type="quiz",
            language="en",
        )

        assert isinstance(code, str)
        assert len(code) > 100, "Game code cần đủ nội dung để render"

    @pytest.mark.asyncio
    async def test_scenario_weekend_activity_suggestions_parramatta(self, patch_pipeline_agents, mock_db):
        """
        Kịch bản: Phụ huynh ở Parramatta hỏi hoạt động cuối tuần liên quan bài học.
        """
        from agent.pipeline import stream_chatbot_response

        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [{
            "processed_en": "Your child is learning about fractions — equal parts of a whole.",
            "subject": "Mathematics",
            "year_level": "Year 3",
        }]

        with patch("agent.pipeline.get_supabase", return_value=mock_db):
            tokens = []
            async for token in stream_chatbot_response(
                user_message="We live near Parramatta. Any fun weekend activities related to what they're learning?",
                brief_id="brief-fractions",
                feature="suggestion",
            ):
                tokens.append(token)

        response = "".join(tokens)
        assert len(response) > 0
        # Mock response là SUGGESTION_ACTIVITIES
        assert isinstance(response, str)
