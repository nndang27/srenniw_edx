"""
TEST: Subagent specs — structural tests, không cần LLM hay DB thật.
Kiểm tra mỗi subagent có đúng format, tools, system_prompt trước khi chạy thật.

Chạy: pytest tests/test_agent_subagents.py -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest


# ═════════════════════════════════════════════════════════════════════════════
# FIXTURES
# ═════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def summarize_spec():
    from agent.subagents.summarize_agent import get_subagent_spec
    return get_subagent_spec()

@pytest.fixture
def diary_spec():
    from agent.subagents.diary_agent import get_subagent_spec
    return get_subagent_spec()

@pytest.fixture
def suggestion_spec():
    from agent.subagents.suggestion_agent import get_subagent_spec
    return get_subagent_spec()

@pytest.fixture
def game_spec():
    from agent.subagents.game_agent import get_subagent_spec
    return get_subagent_spec()

@pytest.fixture
def all_specs(summarize_spec, diary_spec, suggestion_spec, game_spec):
    return {
        "summarize": summarize_spec,
        "diary": diary_spec,
        "suggestion": suggestion_spec,
        "game": game_spec,
    }


# ═════════════════════════════════════════════════════════════════════════════
# REQUIRED FIELDS
# ═════════════════════════════════════════════════════════════════════════════

class TestSubagentStructure:
    """Mỗi SubAgent TypedDict phải có đủ fields bắt buộc."""

    REQUIRED_FIELDS = ["name", "description", "system_prompt", "tools", "model"]

    @pytest.mark.parametrize("feature", ["summarize", "diary", "suggestion", "game"])
    def test_has_all_required_fields(self, all_specs, feature):
        spec = all_specs[feature]
        for field in self.REQUIRED_FIELDS:
            assert field in spec, f"'{feature}' spec thiếu field '{field}'"

    @pytest.mark.parametrize("feature", ["summarize", "diary", "suggestion", "game"])
    def test_name_matches_feature(self, all_specs, feature):
        assert all_specs[feature]["name"] == feature

    @pytest.mark.parametrize("feature", ["summarize", "diary", "suggestion", "game"])
    def test_description_is_nonempty(self, all_specs, feature):
        desc = all_specs[feature]["description"]
        assert isinstance(desc, str) and len(desc) > 20, \
            f"'{feature}' description quá ngắn hoặc rỗng"

    @pytest.mark.parametrize("feature", ["summarize", "diary", "suggestion", "game"])
    def test_system_prompt_is_nonempty(self, all_specs, feature):
        prompt = all_specs[feature]["system_prompt"]
        assert isinstance(prompt, str) and len(prompt) > 50

    @pytest.mark.parametrize("feature", ["summarize", "diary", "suggestion", "game"])
    def test_tools_is_nonempty_list(self, all_specs, feature):
        tools = all_specs[feature]["tools"]
        assert isinstance(tools, list) and len(tools) > 0, \
            f"'{feature}' phải có ít nhất 1 tool"

    @pytest.mark.parametrize("feature", ["summarize", "diary", "suggestion", "game"])
    def test_model_is_valid_provider_format(self, all_specs, feature):
        model = all_specs[feature]["model"]
        assert isinstance(model, str)
        # Must be "provider:model-name" hoặc bare model name
        assert len(model) > 3, "Model string quá ngắn"


# ═════════════════════════════════════════════════════════════════════════════
# TOOL NAMES & SCHEMA
# ═════════════════════════════════════════════════════════════════════════════

class TestSubagentTools:
    """Tools phải là LangChain BaseTool instances với name và description."""

    def test_summarize_has_curricullm_tool(self, summarize_spec):
        tool_names = [t.name for t in summarize_spec["tools"]]
        assert "curricullm_generate" in tool_names

    def test_summarize_has_db_save_brief(self, summarize_spec):
        tool_names = [t.name for t in summarize_spec["tools"]]
        assert "db_save_brief" in tool_names

    def test_summarize_has_db_send_notifications(self, summarize_spec):
        tool_names = [t.name for t in summarize_spec["tools"]]
        assert "db_send_notifications" in tool_names

    def test_all_tools_have_name_and_description(self, all_specs):
        for feature, spec in all_specs.items():
            for tool in spec["tools"]:
                assert hasattr(tool, "name") and tool.name, \
                    f"Tool trong '{feature}' thiếu name"
                assert hasattr(tool, "description") and tool.description, \
                    f"Tool '{tool.name}' trong '{feature}' thiếu description"

    def test_tool_names_are_unique_within_subagent(self, all_specs):
        for feature, spec in all_specs.items():
            names = [t.name for t in spec["tools"]]
            assert len(names) == len(set(names)), \
                f"'{feature}' có tool bị trùng tên: {names}"

    def test_game_tools_include_game_namespace(self, game_spec):
        """Game tools phải có ít nhất 1 tool với prefix 'game_'."""
        tool_names = [t.name for t in game_spec["tools"]]
        game_tools = [n for n in tool_names if n.startswith("game_")]
        assert len(game_tools) >= 1, f"Game subagent thiếu feature tools, có: {tool_names}"


# ═════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT CONTENT — đảm bảo instructions đúng cho primary school
# ═════════════════════════════════════════════════════════════════════════════

class TestSystemPromptContent:

    def test_summarize_prompt_forbids_jargon(self, summarize_spec):
        """Summarize agent phải được dặn tránh jargon giáo dục."""
        prompt = summarize_spec["system_prompt"].lower()
        # Phải mention "jargon" hoặc các từ cụ thể cần tránh
        assert "jargon" in prompt or "curriculum" in prompt or "pedagogy" in prompt

    def test_summarize_prompt_mentions_activities(self, summarize_spec):
        """Summarize agent phải tạo at-home activities."""
        prompt = summarize_spec["system_prompt"].lower()
        assert "activit" in prompt  # "activities" or "activity"

    def test_diary_prompt_mentions_empathy(self, diary_spec):
        """Diary agent phải có yếu tố empathetic/compassionate."""
        prompt = diary_spec["system_prompt"].lower()
        assert any(word in prompt for word in ["empathetic", "compassionate", "constructive"])

    def test_suggestion_prompt_mentions_australia(self, suggestion_spec):
        """Suggestion agent phải context-aware với Australian families."""
        prompt = suggestion_spec["system_prompt"].lower()
        assert "australia" in prompt or "sydney" in prompt or "nsw" in prompt

    def test_game_prompt_requires_react_export(self, game_spec):
        """Game agent phải được dặn export default function App()."""
        prompt = game_spec["system_prompt"]
        assert "export default" in prompt or "App()" in prompt

    def test_game_prompt_forbids_external_imports(self, game_spec):
        """Game agent phải tạo self-contained code không external imports."""
        prompt = game_spec["system_prompt"].lower()
        assert "import" in prompt  # phải đề cập đến import rule


# ═════════════════════════════════════════════════════════════════════════════
# MODEL OVERRIDE — mỗi người có thể đổi model riêng
# ═════════════════════════════════════════════════════════════════════════════

class TestModelOverride:

    def test_summarize_accepts_openai_model(self):
        from agent.subagents.summarize_agent import get_subagent_spec
        spec = get_subagent_spec(model="openai:gpt-4o")
        assert spec["model"] == "openai:gpt-4o"

    def test_diary_accepts_google_model(self):
        from agent.subagents.diary_agent import get_subagent_spec
        spec = get_subagent_spec(model="google:gemini-2.0-flash")
        assert spec["model"] == "google:gemini-2.0-flash"

    def test_game_accepts_zhipuai_model(self):
        from agent.subagents.game_agent import get_subagent_spec
        spec = get_subagent_spec(model="zhipuai:glm-4")
        assert spec["model"] == "zhipuai:glm-4"

    def test_suggestion_accepts_openrouter_model(self):
        from agent.subagents.suggestion_agent import get_subagent_spec
        spec = get_subagent_spec(model="openrouter:meta-llama/llama-3.3-70b")
        assert spec["model"] == "openrouter:meta-llama/llama-3.3-70b"

    def test_default_model_is_anthropic(self, all_specs):
        for feature, spec in all_specs.items():
            assert spec["model"].startswith("anthropic:"), \
                f"'{feature}' default model nên là anthropic, got: {spec['model']}"
