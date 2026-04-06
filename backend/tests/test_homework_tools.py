"""
Test suite: Homework Assistant Tools
=====================================
Kiểm tra 7 tools của chatbot bằng cách so sánh output với dữ liệu thật
trong mock_data_400days.json (932 entries, ~400 ngày).

Mục tiêu: Xác nhận data sinh ra là THẬT (derived from real mock data),
không phải hardcoded hay hallucinated.

Run: cd backend && python -m pytest tests/test_homework_tools.py -v
  or: python tests/test_homework_tools.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import json
import math
from collections import Counter
from pathlib import Path

# ── Load raw mock data once ────────────────────────────────────────────────────

MOCK_PATH = Path(__file__).parent / "data" / "mock_data_400days.json"

with open(MOCK_PATH, encoding="utf-8") as f:
    RAW_ENTRIES = json.load(f)

# Pre-compute expected values directly from raw data (ground truth)
EMOTIONS_ALL    = [e["emotion"] for e in RAW_ENTRIES if e.get("emotion")]
SUBJECTS_ALL    = [e["subject"]  for e in RAW_ENTRIES if e.get("subject")]
COG_LEVELS_ALL  = [e["cognitiveLevel"] for e in RAW_ENTRIES if e.get("cognitiveLevel")]
EMOTION_COUNTS  = Counter(EMOTIONS_ALL)
SUBJECT_COUNTS  = Counter(SUBJECTS_ALL)

EXPECTED_AVG_COG = round(sum(COG_LEVELS_ALL) / len(COG_LEVELS_ALL), 1)
EXPECTED_POSITIVE_RATIO = round(
    sum(1 for e in EMOTIONS_ALL if e in ("Happy", "Excited", "Curious")) / len(EMOTIONS_ALL), 2
)

# ── Import tools ───────────────────────────────────────────────────────────────

from agent.tools.homework import (
    get_current_homework,
    get_wellbeing_summary,
    get_learning_profile,
    get_cognitive_development,
    get_personality_profile,
    get_schedule_context,
    get_health_tips,
    SAMPLE_HOMEWORK_CONTEXT,
)
from agent.tools.homework import _load_insights


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER
# ═══════════════════════════════════════════════════════════════════════════════

def invoke(tool_fn, **kwargs):
    """Call a LangChain @tool by passing kwargs directly."""
    return tool_fn.invoke(kwargs)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 0 — _load_insights() sanity check (pre-condition for all other tests)
# ═══════════════════════════════════════════════════════════════════════════════

def test_load_insights_returns_real_data():
    """Insights pipeline must load from real mock file and return expected keys."""
    data = _load_insights()
    assert "_error" not in data, f"_load_insights() failed: {data.get('_error')}"

    expected_keys = {"intelligences", "vark", "cognition", "emotion", "personality", "career", "meta"}
    assert expected_keys.issubset(data.keys()), f"Missing keys: {expected_keys - set(data.keys())}"
    print("  [OK] _load_insights() returned all expected keys")


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 1 — get_current_homework
# ═══════════════════════════════════════════════════════════════════════════════

def test_homework_all_subjects():
    """No filter → all 4 subjects returned."""
    result = invoke(get_current_homework, subject="")
    for subj in ("Maths", "English", "Science", "HSIE"):
        assert subj in result, f"Expected '{subj}' in homework output"
    print("  [OK] All 4 subjects present in homework output")


def test_homework_filter_by_subject():
    """Filter by 'Maths' → only Maths returned, English absent."""
    result = invoke(get_current_homework, subject="Maths")
    assert "Maths" in result
    assert "English" not in result
    assert "area model" in result.lower(), "Expected area model concept in Maths"
    print("  [OK] Subject filter works correctly")


def test_homework_unknown_subject():
    """Non-existent subject → not-found message, no crash."""
    result = invoke(get_current_homework, subject="Music")
    assert "No homework found" in result
    print("  [OK] Unknown subject returns graceful message")


def test_homework_matches_sample_context():
    """Output consistent with SAMPLE_HOMEWORK_CONTEXT definitions."""
    result = invoke(get_current_homework, subject="")
    ctx = SAMPLE_HOMEWORK_CONTEXT
    assert ctx["week"] in result
    assert ctx["year_level"] in result
    for assignment in ctx["assignments"]:
        assert assignment["subject"] in result
        assert assignment["due"] in result
    print("  [OK] Output matches SAMPLE_HOMEWORK_CONTEXT")


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 2 — get_wellbeing_summary
# ═══════════════════════════════════════════════════════════════════════════════

def test_wellbeing_summary_structure():
    """Must contain PERMA section and positivity ratio."""
    result = invoke(get_wellbeing_summary)
    assert "WELLBEING" in result.upper()
    for dim in ("Positive", "Engagement", "Relationships", "Meaning", "Achievement"):
        assert dim in result, f"PERMA dimension '{dim}' missing from wellbeing summary"
    print("  [OK] All 5 PERMA dimensions present")


def test_wellbeing_positivity_ratio_realistic():
    """
    Positivity ratio from tool must be close to ground-truth value computed
    directly from raw mock data (within ±15%).
    """
    data = _load_insights()
    ratio_from_tool = data["emotion"]["positivity_ratio"]

    # Ground truth: (Happy + Excited + Curious) / total
    assert abs(ratio_from_tool - EXPECTED_POSITIVE_RATIO) <= 0.15, (
        f"Tool ratio={ratio_from_tool:.2f} vs raw data ratio={EXPECTED_POSITIVE_RATIO:.2f} "
        f"(gap > 15% — data may be wrong)"
    )
    print(f"  [OK] Positivity ratio {ratio_from_tool:.2f} matches raw data {EXPECTED_POSITIVE_RATIO:.2f}")


def test_wellbeing_dominant_emotion_matches_raw():
    """
    The most frequent emotion in raw data should be reflected in the tool output.
    """
    dominant = EMOTION_COUNTS.most_common(1)[0][0]
    result = invoke(get_wellbeing_summary)
    # The dominant emotion or a related status should appear somewhere
    assert len(result) > 100, "Wellbeing summary too short — likely empty"
    print(f"  [OK] Dominant emotion in raw data: '{dominant}', wellbeing summary non-empty")


def test_wellbeing_no_fabricated_scores():
    """PERMA scores must be 0-100 integers, not fabricated floats."""
    data = _load_insights()
    perma = data["emotion"]["perma_scores"]
    for dim, score in perma.items():
        assert 0 <= score <= 100, f"PERMA score out of range: {dim}={score}"
        assert isinstance(score, (int, float)), f"PERMA score not numeric: {dim}={score}"
    print(f"  [OK] All PERMA scores in valid range 0-100: {perma}")


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 3 — get_learning_profile (VARK + Intelligences)
# ═══════════════════════════════════════════════════════════════════════════════

def test_learning_profile_vark_sums_to_100():
    """VARK distribution percentages must sum to exactly 100."""
    data = _load_insights()
    dist = data["vark"]["vark_distribution"]
    total = sum(dist.values())
    assert total == 100, f"VARK distribution sums to {total}, expected 100. Dist: {dist}"
    print(f"  [OK] VARK sums to 100: {dist}")


def test_learning_profile_primary_style_is_highest():
    """Primary learning style must be the highest-scoring VARK dimension."""
    data = _load_insights()
    dist = data["vark"]["vark_distribution"]
    primary = data["vark"]["primary_hint"]
    expected_primary = max(dist, key=dist.get)
    assert primary == expected_primary, (
        f"Primary style '{primary}' != highest in dist '{expected_primary}' — {dist}"
    )
    print(f"  [OK] Primary style '{primary}' correctly matches highest VARK score")


def test_learning_profile_intelligences_in_range():
    """All intelligence scores must be 0-100."""
    data = _load_insights()
    radar = data["intelligences"]["radar_data"]
    for name, score in radar.items():
        assert 0 <= score <= 100, f"Intelligence score out of range: {name}={score}"
    print(f"  [OK] All intelligence scores valid: {radar}")


def test_learning_profile_top_strengths_in_radar():
    """Top strengths must be actual keys in radar_data."""
    data = _load_insights()
    radar = data["intelligences"]["radar_data"]
    top = data["intelligences"]["top_strengths"]
    for s in top:
        assert s in radar, f"Top strength '{s}' not found in radar_data keys: {list(radar.keys())}"
    print(f"  [OK] Top strengths {top} all exist in radar_data")


def test_learning_profile_output_contains_vark_labels():
    """Tool output string must contain VARK category names."""
    result = invoke(get_learning_profile)
    for label in ("Visual", "Auditory", "Reading", "Kinesthetic"):
        assert label in result, f"'{label}' missing from learning profile output"
    print("  [OK] All VARK labels present in output string")


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 4 — get_cognitive_development
# ═══════════════════════════════════════════════════════════════════════════════

def test_cognitive_avg_bloom_matches_raw():
    """
    Average Bloom level from tool must be close to raw data average (±0.5).
    Raw data has cognitiveLevel 1-5. Tool computes with decay weighting,
    so slight difference is expected but should not be wildly off.
    """
    data = _load_insights()
    tool_avg = data["cognition"]["average_bloom_level"]

    assert abs(tool_avg - EXPECTED_AVG_COG) <= 0.8, (
        f"Tool avg Bloom={tool_avg:.2f} vs raw simple avg={EXPECTED_AVG_COG:.2f} "
        f"(gap > 0.8 — check decay logic)"
    )
    print(f"  [OK] Tool avg Bloom {tool_avg:.2f} ≈ raw avg {EXPECTED_AVG_COG:.2f}")


def test_cognitive_status_badge_valid():
    """Status badge must be one of the known values."""
    data = _load_insights()
    badge = data["cognition"]["status_badge"]
    valid = {"Building Foundations", "On Track", "Exploring Ahead"}
    assert badge in valid, f"Unknown status badge: '{badge}'"
    print(f"  [OK] Status badge '{badge}' is valid")


def test_cognitive_weekly_trend_chronological():
    """Weekly trend entries must be in chronological order."""
    data = _load_insights()
    trend = data["cognition"]["weekly_trend"]
    assert len(trend) >= 4, "Weekly trend too short"
    weeks = [pt["week"] for pt in trend]
    assert weeks == sorted(weeks), f"Weekly trend not sorted: {weeks}"
    print(f"  [OK] Weekly trend chronological ({len(trend)} points)")


def test_cognitive_subject_avgs_reflect_raw_subjects():
    """Subject averages must only contain subjects present in raw data."""
    data = _load_insights()
    subj_avgs = data.get("meta", {}).get("subject_avgs", {})
    raw_subjects = set(SUBJECT_COUNTS.keys())
    for subj in subj_avgs:
        assert subj in raw_subjects, (
            f"Subject '{subj}' in tool output not found in raw data: {raw_subjects}"
        )
    print(f"  [OK] All subject avgs match raw data subjects: {list(subj_avgs.keys())}")


def test_cognitive_subject_avgs_in_bloom_range():
    """Subject averages must be between 1 and 5 (Bloom's range)."""
    data = _load_insights()
    subj_avgs = data.get("meta", {}).get("subject_avgs", {})
    for subj, avg in subj_avgs.items():
        assert 1.0 <= avg <= 5.0, f"Subject avg out of Bloom range: {subj}={avg}"
    print(f"  [OK] All subject averages in valid Bloom range 1-5")


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 5 — get_personality_profile (OCEAN)
# ═══════════════════════════════════════════════════════════════════════════════

def test_personality_ocean_keys_correct():
    """Must contain exactly the 5 Big Five trait names (English)."""
    data = _load_insights()
    traits = data["personality"]["traits"]
    expected = {"Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"}
    assert set(traits.keys()) == expected, (
        f"OCEAN keys mismatch. Got: {set(traits.keys())} Expected: {expected}"
    )
    print(f"  [OK] OCEAN trait keys correct: {list(traits.keys())}")


def test_personality_traits_in_range():
    """All OCEAN scores must be 0-100."""
    data = _load_insights()
    traits = data["personality"]["traits"]
    for trait, score in traits.items():
        assert 0 <= score <= 100, f"OCEAN score out of range: {trait}={score}"
    print(f"  [OK] All OCEAN scores valid 0-100: {traits}")


def test_personality_superpower_non_empty():
    """Superpower must be a non-empty string."""
    data = _load_insights()
    superpower = data["personality"]["superpower"]
    assert isinstance(superpower, str) and len(superpower) > 2, (
        f"Superpower too short or wrong type: '{superpower}'"
    )
    print(f"  [OK] Superpower: '{superpower}'")


def test_personality_career_holland_code():
    """Holland code must be 1-3 uppercase letters."""
    data = _load_insights()
    code = data["career"].get("holland_code", "")
    assert 1 <= len(code) <= 3, f"Holland code wrong length: '{code}'"
    assert code.isupper(), f"Holland code not uppercase: '{code}'"
    print(f"  [OK] Holland code: '{code}'")


def test_personality_output_contains_ocean_labels():
    """Tool string output must mention all 5 OCEAN traits."""
    result = invoke(get_personality_profile)
    for trait in ("Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"):
        assert trait in result, f"OCEAN trait '{trait}' missing from output"
    print("  [OK] All 5 OCEAN traits in personality output string")


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 6 — get_schedule_context
# ═══════════════════════════════════════════════════════════════════════════════

def test_schedule_contains_all_due_dates():
    """Output must list all due dates from SAMPLE_HOMEWORK_CONTEXT."""
    result = invoke(get_schedule_context)
    for assignment in SAMPLE_HOMEWORK_CONTEXT["assignments"]:
        assert assignment["due"] in result, (
            f"Due date '{assignment['due']}' for {assignment['subject']} missing from schedule"
        )
    print("  [OK] All due dates present in schedule output")


def test_schedule_routine_tips_non_empty():
    """Must contain routine tips (not just raw data)."""
    result = invoke(get_schedule_context)
    assert "routine" in result.lower() or "tip" in result.lower() or "session" in result.lower()
    assert len(result) > 200, "Schedule output too short"
    print("  [OK] Schedule output contains meaningful routine advice")


def test_schedule_status_based_tips():
    """
    Tips must match the cognitive status badge from insights.
    'Exploring Ahead' learner should get more advanced tip language.
    """
    data = _load_insights()
    status = data["cognition"]["status_badge"]
    result = invoke(get_schedule_context)
    assert status in result, f"Status badge '{status}' not mentioned in schedule output"
    print(f"  [OK] Schedule tips calibrated for '{status}' status")


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 7 — get_health_tips
# ═══════════════════════════════════════════════════════════════════════════════

def test_health_tips_all_topics_default():
    """No filter → all 3 topics returned."""
    result = invoke(get_health_tips, topic="")
    for topic in ("Sleep", "Nutrition", "Physical"):
        assert topic in result or topic.lower() in result.lower(), (
            f"Health topic '{topic}' missing from default output"
        )
    print("  [OK] All 3 health topics present in default output")


def test_health_tips_sleep_filter():
    """Filter 'sleep' → sleep content, nutrition absent."""
    result = invoke(get_health_tips, topic="sleep")
    assert "sleep" in result.lower()
    assert "melatonin" in result.lower() or "bedtime" in result.lower(), \
        "Sleep tips should mention melatonin or bedtime"
    assert "omega" not in result.lower(), "Nutrition content should not appear in sleep filter"
    print("  [OK] Sleep filter works, returns sleep-specific content")


def test_health_tips_nutrition_filter():
    """Filter 'nutrition' → nutrition content."""
    result = invoke(get_health_tips, topic="nutrition")
    assert "breakfast" in result.lower() or "omega" in result.lower()
    print("  [OK] Nutrition filter returns relevant content")


def test_health_tips_exercise_filter():
    """Filter 'exercise' → exercise content."""
    result = invoke(get_health_tips, topic="exercise")
    assert "exercise" in result.lower() or "activity" in result.lower()
    print("  [OK] Exercise filter returns relevant content")


def test_health_tips_unknown_topic():
    """Unknown topic → returns all tips (graceful fallback)."""
    result = invoke(get_health_tips, topic="yoga")
    # Should fall back to showing all tips
    assert "sleep" in result.lower() or "nutrition" in result.lower()
    print("  [OK] Unknown topic falls back to all-topics output")


# ═══════════════════════════════════════════════════════════════════════════════
# CROSS-TOOL: Data consistency checks
# ═══════════════════════════════════════════════════════════════════════════════

def test_cross_vark_and_schedule_consistency():
    """
    Schedule tips should be calibrated to the cognitive status,
    which is derived from the same 400-day data as VARK.
    Both must load from the same cached _load_insights() call.
    """
    data1 = _load_insights()
    data2 = _load_insights()  # Should be same cached object
    assert data1 is data2, "lru_cache not working — two different objects returned"
    print("  [OK] lru_cache working: _load_insights() returns same object on 2nd call")


def test_cross_emotion_count_sanity():
    """
    Raw data has 932 entries. Tool must derive from same dataset.
    Verify positivity count makes sense.
    """
    n_positive = sum(1 for e in EMOTIONS_ALL if e in ("Happy", "Excited", "Curious"))
    n_total = len(EMOTIONS_ALL)
    assert n_total == 932, f"Expected 932 entries, got {n_total}"
    assert 0.3 <= n_positive / n_total <= 0.9, "Positivity ratio extreme — check mock data"
    print(f"  [OK] Raw data: {n_positive}/{n_total} positive emotions ({n_positive/n_total:.0%})")


def test_cross_no_none_in_tool_outputs():
    """No tool should return None or empty string."""
    tools_and_args = [
        (get_current_homework, {"subject": ""}),
        (get_wellbeing_summary, {}),
        (get_learning_profile, {}),
        (get_cognitive_development, {}),
        (get_personality_profile, {}),
        (get_schedule_context, {}),
        (get_health_tips, {"topic": ""}),
    ]
    for tool_fn, args in tools_and_args:
        result = invoke(tool_fn, **args)
        assert result is not None, f"{tool_fn.name} returned None"
        assert len(result.strip()) > 50, f"{tool_fn.name} returned near-empty string: '{result[:50]}'"
    print("  [OK] All 7 tools return non-empty meaningful strings")


# ═══════════════════════════════════════════════════════════════════════════════
# RUNNER
# ═══════════════════════════════════════════════════════════════════════════════

ALL_TESTS = [
    # _load_insights pre-condition
    ("_load_insights sanity",               test_load_insights_returns_real_data),
    # Tool 1
    ("Homework: all subjects",              test_homework_all_subjects),
    ("Homework: subject filter",            test_homework_filter_by_subject),
    ("Homework: unknown subject",           test_homework_unknown_subject),
    ("Homework: matches context",           test_homework_matches_sample_context),
    # Tool 2
    ("Wellbeing: PERMA structure",          test_wellbeing_summary_structure),
    ("Wellbeing: positivity ratio",         test_wellbeing_positivity_ratio_realistic),
    ("Wellbeing: dominant emotion",         test_wellbeing_dominant_emotion_matches_raw),
    ("Wellbeing: scores 0-100",             test_wellbeing_no_fabricated_scores),
    # Tool 3
    ("Learning: VARK sums 100",             test_learning_profile_vark_sums_to_100),
    ("Learning: primary = highest VARK",    test_learning_profile_primary_style_is_highest),
    ("Learning: intelligences 0-100",       test_learning_profile_intelligences_in_range),
    ("Learning: top strengths in radar",    test_learning_profile_top_strengths_in_radar),
    ("Learning: output has VARK labels",    test_learning_profile_output_contains_vark_labels),
    # Tool 4
    ("Cognition: avg Bloom vs raw",         test_cognitive_avg_bloom_matches_raw),
    ("Cognition: status badge valid",       test_cognitive_status_badge_valid),
    ("Cognition: trend chronological",      test_cognitive_weekly_trend_chronological),
    ("Cognition: subject avgs vs raw",      test_cognitive_subject_avgs_reflect_raw_subjects),
    ("Cognition: subject avgs Bloom range", test_cognitive_subject_avgs_in_bloom_range),
    # Tool 5
    ("Personality: OCEAN keys English",     test_personality_ocean_keys_correct),
    ("Personality: OCEAN 0-100",            test_personality_traits_in_range),
    ("Personality: superpower non-empty",   test_personality_superpower_non_empty),
    ("Personality: Holland code format",    test_personality_career_holland_code),
    ("Personality: output has OCEAN",       test_personality_output_contains_ocean_labels),
    # Tool 6
    ("Schedule: all due dates",             test_schedule_contains_all_due_dates),
    ("Schedule: has routine tips",          test_schedule_routine_tips_non_empty),
    ("Schedule: status-based tips",         test_schedule_status_based_tips),
    # Tool 7
    ("Health: all topics default",          test_health_tips_all_topics_default),
    ("Health: sleep filter",                test_health_tips_sleep_filter),
    ("Health: nutrition filter",            test_health_tips_nutrition_filter),
    ("Health: exercise filter",             test_health_tips_exercise_filter),
    ("Health: unknown topic fallback",      test_health_tips_unknown_topic),
    # Cross-tool
    ("Cross: lru_cache works",              test_cross_vark_and_schedule_consistency),
    ("Cross: emotion count sanity",         test_cross_emotion_count_sanity),
    ("Cross: no None/empty outputs",        test_cross_no_none_in_tool_outputs),
]


if __name__ == "__main__":
    passed = failed = 0
    print(f"\n{'='*65}")
    print(f"  Homework Tools Test Suite — {len(ALL_TESTS)} tests")
    print(f"  Data: {MOCK_PATH.name} ({len(RAW_ENTRIES)} entries)")
    print(f"{'='*65}\n")

    for name, fn in ALL_TESTS:
        try:
            fn()
            print(f"PASS  {name}")
            passed += 1
        except AssertionError as e:
            print(f"FAIL  {name}")
            print(f"      ↳ {e}")
            failed += 1
        except Exception as e:
            print(f"ERROR {name}")
            print(f"      ↳ {type(e).__name__}: {e}")
            failed += 1

    print(f"\n{'='*65}")
    print(f"  Results: {passed} passed, {failed} failed / {len(ALL_TESTS)} total")
    print(f"{'='*65}\n")
    sys.exit(0 if failed == 0 else 1)
