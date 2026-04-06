"""
TEST: Individual tool functions — unit tests với mocked httpx và Supabase.
Không cần API key hay DB thật.

Chạy: pytest tests/test_agent_tools.py -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch


# ═════════════════════════════════════════════════════════════════════════════
# CURRICULLM TOOL TESTS
# ═════════════════════════════════════════════════════════════════════════════

class TestCurricuLLMTool:
    """curricullm_generate: gọi CurricuLLM API và trả về content."""

    @pytest.fixture
    def mock_env(self, monkeypatch):
        monkeypatch.setenv("CURRICULLM_BASE_URL", "https://fake-api.curricullm.com")
        monkeypatch.setenv("CURRICULLM_API_KEY", "test-key-123")

    def _make_llm_response(self, content: str) -> dict:
        return {
            "choices": [{"message": {"content": content}}]
        }

    @pytest.mark.asyncio
    async def test_summarize_fractions_brief(self, mock_env):
        """Tóm tắt nội dung fractions cho Year 3."""
        from agent.tools.curricullm_tools import curricullm_generate

        expected = (
            "This week your child is learning about fractions! "
            "They're discovering how to split things into equal parts — "
            "like cutting a pizza into 4 slices."
        )
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = self._make_llm_response(expected)

        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_resp
            )
            result = await curricullm_generate.ainvoke({
                "prompt": "Explain fractions to parents of Year 3 students",
                "year_level": "Year 3",
                "subject": "Mathematics",
                "output_format": "text",
            })

        assert result == expected

    @pytest.mark.asyncio
    async def test_activity_generation_request(self, mock_env):
        """Tạo at-home activities cho Year 2 English."""
        from agent.tools.curricullm_tools import curricullm_generate

        expected = json.dumps([
            {"title": "Story Jar", "description": "Write story words on paper, draw one each night", "duration_mins": 10},
            {"title": "Rhyme Hunt", "description": "Find 5 things in the house that rhyme", "duration_mins": 15},
        ])
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = self._make_llm_response(expected)

        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_resp
            )
            result = await curricullm_generate.ainvoke({
                "prompt": "Create 3 at-home activities for Year 2 English — phonics and reading",
                "year_level": "Year 2",
                "subject": "English",
                "output_format": "json",
            })

        assert result == expected

    @pytest.mark.asyncio
    async def test_handles_api_error_gracefully(self, mock_env):
        """Lỗi API trả về error message, không raise exception."""
        from agent.tools.curricullm_tools import curricullm_generate

        mock_resp = MagicMock()
        mock_resp.status_code = 503
        mock_resp.text = "Service Unavailable"

        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_resp
            )
            result = await curricullm_generate.ainvoke({
                "prompt": "Test prompt",
            })

        assert "error" in result.lower() or "503" in result

    @pytest.mark.asyncio
    async def test_request_includes_curriculum_metadata(self, mock_env):
        """Khi có year_level + subject, request phải gửi curriculum field."""
        from agent.tools.curricullm_tools import curricullm_generate

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = self._make_llm_response("OK")

        captured_payload = {}

        async def capture_post(url, **kwargs):
            captured_payload.update(kwargs.get("json", {}))
            return mock_resp

        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = capture_post
            await curricullm_generate.ainvoke({
                "prompt": "Generate content",
                "year_level": "Year 4",
                "subject": "Science",
            })

        assert "curriculum" in captured_payload
        assert captured_payload["curriculum"]["stage"] == "Year 4"
        assert captured_payload["curriculum"]["subject"] == "Science"


# ═════════════════════════════════════════════════════════════════════════════
# SUPABASE TOOL TESTS
# ═════════════════════════════════════════════════════════════════════════════

class TestSupabaseTools:

    def _make_db(self):
        db = MagicMock()
        db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        db.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
        db.table.return_value.insert.return_value.execute.return_value.data = []
        return db

    @pytest.mark.asyncio
    async def test_db_get_parent_profiles_returns_list(self):
        """db_get_parent_profiles trả về JSON với parents array."""
        from agent.tools.supabase_tools import db_get_parent_profiles

        db = self._make_db()
        db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"parent_clerk_id": "parent_1", "preferred_language": "vi", "child_name": "Minh"},
            {"parent_clerk_id": "parent_2", "preferred_language": "zh", "child_name": "Li Wei"},
        ]

        with patch("agent.tools.supabase_tools.get_supabase", return_value=db):
            result = await db_get_parent_profiles.ainvoke({"class_id": "class-uuid-123"})

        data = json.loads(result)
        assert data["count"] == 2
        assert len(data["parents"]) == 2
        assert data["parents"][0]["child_name"] == "Minh"

    @pytest.mark.asyncio
    async def test_db_save_brief_updates_status_to_done(self):
        """db_save_brief harus update status='done' và published_at."""
        from agent.tools.supabase_tools import db_save_brief

        db = self._make_db()
        captured_update = {}

        def capture_update(data):
            captured_update.update(data)
            return db.table.return_value.update.return_value

        db.table.return_value.update = capture_update

        with patch("agent.tools.supabase_tools.get_supabase", return_value=db):
            result = await db_save_brief.ainvoke({
                "brief_id": "brief-uuid-456",
                "processed_en": "Your child is learning about fractions this week!",
                "at_home_activities": json.dumps([
                    {"title": "Pizza Fractions", "description": "Cut pizza into equal slices", "duration_mins": 20}
                ]),
            })

        data = json.loads(result)
        assert data["saved"] is True
        assert data["brief_id"] == "brief-uuid-456"
        assert captured_update.get("status") == "done"
        assert "published_at" in captured_update

    @pytest.mark.asyncio
    async def test_db_save_brief_parses_activities_json_string(self):
        """db_save_brief nhận activities dạng JSON string và parse đúng."""
        from agent.tools.supabase_tools import db_save_brief

        db = self._make_db()
        captured_update = {}

        def capture_update(data):
            captured_update.update(data)
            return db.table.return_value.update.return_value

        db.table.return_value.update = capture_update

        activities_str = '[{"title": "Test", "description": "Do it", "duration_mins": 10}]'

        with patch("agent.tools.supabase_tools.get_supabase", return_value=db):
            await db_save_brief.ainvoke({
                "brief_id": "brief-1",
                "processed_en": "Summary text",
                "at_home_activities": activities_str,
            })

        assert isinstance(captured_update.get("at_home_activities"), list)
        assert captured_update["at_home_activities"][0]["title"] == "Test"

    @pytest.mark.asyncio
    async def test_db_save_brief_handles_invalid_activities_json(self):
        """db_save_brief nhận activities JSON lỗi thì dùng empty list, không crash."""
        from agent.tools.supabase_tools import db_save_brief

        db = self._make_db()
        captured_update = {}

        def capture_update(data):
            captured_update.update(data)
            return db.table.return_value.update.return_value

        db.table.return_value.update = capture_update

        with patch("agent.tools.supabase_tools.get_supabase", return_value=db):
            result = await db_save_brief.ainvoke({
                "brief_id": "brief-1",
                "processed_en": "Summary",
                "at_home_activities": "this is not json {{{",
            })

        assert json.loads(result)["saved"] is True
        assert captured_update.get("at_home_activities") == []

    @pytest.mark.asyncio
    async def test_db_send_notifications_creates_row_per_parent(self):
        """db_send_notifications tạo 1 notification row cho mỗi parent."""
        from agent.tools.supabase_tools import db_send_notifications

        db = self._make_db()
        db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"parent_clerk_id": "p1"},
            {"parent_clerk_id": "p2"},
            {"parent_clerk_id": "p3"},
        ]
        inserted_rows = []
        db.table.return_value.insert.side_effect = lambda rows: (
            inserted_rows.extend(rows) or db.table.return_value.insert.return_value
        )

        with patch("agent.tools.supabase_tools.get_supabase", return_value=db):
            result = await db_send_notifications.ainvoke({
                "brief_id": "brief-uuid",
                "class_id": "class-uuid",
            })

        data = json.loads(result)
        assert data["sent_to"] == 3

    @pytest.mark.asyncio
    async def test_db_send_notifications_skips_insert_when_no_parents(self):
        """db_send_notifications không insert nếu không có parent nào."""
        from agent.tools.supabase_tools import db_send_notifications

        db = self._make_db()
        db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []

        with patch("agent.tools.supabase_tools.get_supabase", return_value=db):
            result = await db_send_notifications.ainvoke({
                "brief_id": "brief-1",
                "class_id": "empty-class",
            })

        data = json.loads(result)
        assert data["sent_to"] == 0
        # insert không được gọi
        db.table.return_value.insert.assert_not_called()


# ═════════════════════════════════════════════════════════════════════════════
# FEATURE TOOL PLACEHOLDER TESTS
# ═════════════════════════════════════════════════════════════════════════════

class TestFeatureToolPlaceholders:
    """Đảm bảo placeholder tools của mỗi feature có thể invoke được."""

    @pytest.mark.asyncio
    async def test_summarize_search_tool_returns_string(self):
        from agent.tools.summarize import get_tools
        tools = {t.name: t for t in get_tools()}
        assert "summarize_search_related_content" in tools

        result = await tools["summarize_search_related_content"].ainvoke({
            "topic": "fractions",
            "year_level": "Year 3",
        })
        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_diary_bloom_tool_returns_string(self):
        from agent.tools.diary import get_tools
        tools = {t.name: t for t in get_tools()}
        assert "diary_analyze_bloom_level" in tools

        result = await tools["diary_analyze_bloom_level"].ainvoke({
            "journal_text": "My child struggled with homework but eventually understood."
        })
        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_suggestion_location_tool_returns_string(self):
        from agent.tools.suggestion import get_tools
        tools = {t.name: t for t in get_tools()}
        assert "suggestion_find_nearby_activities" in tools

        result = await tools["suggestion_find_nearby_activities"].ainvoke({
            "suburb": "Parramatta",
            "subject": "Science",
            "year_level": "Year 4",
        })
        assert isinstance(result, str)

    @pytest.mark.asyncio
    async def test_game_template_tool_returns_string(self):
        from agent.tools.game import get_tools
        tools = {t.name: t for t in get_tools()}
        assert "game_load_template" in tools

        result = await tools["game_load_template"].ainvoke({
            "game_type": "quiz",
            "subject": "Mathematics",
        })
        assert isinstance(result, str)
