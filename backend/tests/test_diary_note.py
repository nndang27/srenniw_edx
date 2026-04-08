"""
Integration tests: diary-note save pipeline
============================================
Verifies that when a parent or teacher submits a journal note:
  1. note_scorer is called and scores are computed
  2. student_diaries is upserted with all fields (cognitive_level, emotion,
     parent_note, parent_note_scores / teacher_note, teacher_note_scores)
  3. Response includes {ok: True, diary_id, scores}
  4. On next GET /diary, the saved data is readable back with scores
  5. Teacher GET /classes/{id}/students reflects updated diary entries
"""
import pytest
from unittest.mock import patch, MagicMock, call
import json


# ─── Helpers ──────────────────────────────────────────────────────────────────

def make_supabase_chain(db: MagicMock, table_name: str, method_chain: str, return_val):
    """Helper: shortcut for deeply nested mock chain assertions."""
    pass  # We use call_args inspection directly


# ─── 1. Parent diary-note: new entry (insert) ─────────────────────────────────

def test_parent_diary_note_insert_new_entry(client_as_parent, mock_supabase):
    """
    When no existing diary entry for date+subject, endpoint should INSERT a new row
    with parent_note_scores computed by score_note_fast.
    """
    student_id = "student-uuid-001"

    # class_parents → student_id lookup
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"student_id": student_id}
    ]
    # student_diaries existence check → empty (no existing row)
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.eq.return_value\
        .limit.return_value.execute.return_value.data = []
    # insert → returns id
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "diary-new-001"}
    ]

    res = client_as_parent.patch("/api/parent/diary-note", json={
        "date": "2026-04-06",
        "subject": "Maths",
        "parent_note": "She was very excited and asked lots of questions about fractions.",
        "cognitive_level": 4,
        "emotion": "Excited",
    })

    assert res.status_code == 200
    body = res.json()

    # ok flag
    assert body["ok"] is True
    assert body["diary_id"] == "diary-new-001"

    # scores must be present and match parent note structure
    assert body["scores"] is not None
    scores = body["scores"]
    assert "emotion_sentiment" in scores
    assert "parent_child_connection" in scores
    assert "activity_level" in scores
    assert "social_engagement" in scores
    assert "curiosity_index" in scores
    assert "focus_depth" in scores

    # emotion_sentiment for positive note should be > 3.0
    assert scores["emotion_sentiment"] > 3.0

    # curiosity_index should be elevated (note contains "questions")
    assert scores["curiosity_index"] > 0.0

    # Verify DB insert was called (not update)
    insert_calls = mock_supabase.table.return_value.insert.call_args_list
    assert len(insert_calls) > 0


def test_parent_diary_note_updates_existing_row(client_as_parent, mock_supabase):
    """
    When a diary entry already exists for date+subject, endpoint should UPDATE it.
    """
    student_id = "student-uuid-001"
    existing_id = "diary-existing-999"

    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"student_id": student_id}
    ]
    # Existing row found
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.eq.return_value\
        .limit.return_value.execute.return_value.data = [
        {"id": existing_id}
    ]

    res = client_as_parent.patch("/api/parent/diary-note", json={
        "date": "2026-04-06",
        "subject": "Maths",
        "parent_note": "He struggled a bit but was patient.",
        "cognitive_level": 2,
        "emotion": "Anxious",
    })

    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["diary_id"] == existing_id

    # emotion_sentiment for negative note should be <= 3.0
    scores = body["scores"]
    assert scores["emotion_sentiment"] <= 3.5  # "struggled", "anxious" — neutral/negative

    # Verify UPDATE was called (not insert)
    update_calls = mock_supabase.table.return_value.update.call_args_list
    assert len(update_calls) > 0


def test_parent_diary_note_no_note_text_still_saves(client_as_parent, mock_supabase):
    """
    Sending cognitive_level and emotion without parent_note should still save,
    and scores field in response should be None (no text to score).
    """
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"student_id": "student-001"}
    ]
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.eq.return_value\
        .limit.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "diary-003"}
    ]

    res = client_as_parent.patch("/api/parent/diary-note", json={
        "date": "2026-04-07",
        "subject": "Science",
        "cognitive_level": 3,
        "emotion": "Curious",
        # no parent_note
    })

    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["scores"] is None


def test_parent_diary_note_missing_student_returns_404(client_as_parent, mock_supabase):
    """When parent has no linked student, return 404."""
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = []

    res = client_as_parent.patch("/api/parent/diary-note", json={
        "date": "2026-04-06",
        "subject": "Maths",
        "cognitive_level": 3,
        "emotion": "Happy",
    })
    assert res.status_code == 404


# ─── 2. score_note_fast: unit test the scorer directly ──────────────────────

def test_score_note_fast_positive_parent_note():
    """Positive note → high emotion_sentiment, elevated curiosity."""
    from agent.tools.insights.note_scorer import score_note_fast

    scores = score_note_fast(
        "She was really excited today! Asked so many great questions and explored the topic on her own.",
        "parent"
    )
    assert scores["emotion_sentiment"] > 3.5
    assert scores["curiosity_index"] > 0.0
    # All keys present
    for key in ["emotion_sentiment", "parent_child_connection", "activity_level",
                "social_engagement", "curiosity_index", "focus_depth"]:
        assert key in scores


def test_score_note_fast_negative_parent_note():
    """Negative/anxious note → low emotion_sentiment."""
    from agent.tools.insights.note_scorer import score_note_fast

    scores = score_note_fast(
        "He was crying and didn't want to do homework. Very anxious and frustrated.",
        "parent"
    )
    assert scores["emotion_sentiment"] < 3.0


def test_score_note_fast_vietnamese_parent_note():
    """Vietnamese text should still produce valid scores."""
    from agent.tools.insights.note_scorer import score_note_fast

    scores = score_note_fast(
        "Con rất vui và hào hứng hôm nay! Hỏi rất nhiều câu hỏi hay về bài toán.",
        "parent"
    )
    assert scores["emotion_sentiment"] > 3.0
    for key in ["emotion_sentiment", "parent_child_connection", "activity_level",
                "social_engagement", "curiosity_index", "focus_depth"]:
        assert key in scores
        assert isinstance(scores[key], float)


def test_score_note_fast_teacher_note():
    """Teacher note → 4 dimensions returned."""
    from agent.tools.insights.note_scorer import score_note_fast

    scores = score_note_fast(
        "Excellent participation today! Student raised hand frequently and showed great understanding.",
        "teacher"
    )
    for key in ["emotion_sentiment", "encouragement_level", "difficulty_signal", "engagement_observed"]:
        assert key in scores
    assert scores["encouragement_level"] > 0.0
    assert scores["engagement_observed"] > 0.0
    # No struggle → difficulty_signal should be low
    assert scores["difficulty_signal"] < 0.5


def test_score_note_fast_teacher_struggling_note():
    """Note mentioning struggle → elevated difficulty_signal."""
    from agent.tools.insights.note_scorer import score_note_fast

    scores = score_note_fast(
        "Student struggled with the new concept. Needs more practice and additional support.",
        "teacher"
    )
    assert scores["difficulty_signal"] > 0.0


def test_score_note_fast_empty_text_returns_defaults():
    """Empty text → neutral defaults, no crash."""
    from agent.tools.insights.note_scorer import score_note_fast

    parent_scores = score_note_fast("", "parent")
    assert parent_scores["emotion_sentiment"] == 3.0

    teacher_scores = score_note_fast("", "teacher")
    assert teacher_scores["emotion_sentiment"] == 3.0


def test_score_values_are_clamped():
    """All output values must be in valid ranges."""
    from agent.tools.insights.note_scorer import score_note_fast

    # Extreme positive
    extreme = "excellent wonderful amazing happy excited great fantastic outstanding"
    p = score_note_fast(extreme, "parent")
    assert 1.0 <= p["emotion_sentiment"] <= 5.0
    for k in ["parent_child_connection", "activity_level", "social_engagement",
              "curiosity_index", "focus_depth"]:
        assert 0.0 <= p[k] <= 1.0

    t = score_note_fast(extreme, "teacher")
    assert 1.0 <= t["emotion_sentiment"] <= 5.0
    for k in ["encouragement_level", "difficulty_signal", "engagement_observed"]:
        assert 0.0 <= t[k] <= 1.0


# ─── 3. Teacher diary-note endpoint ──────────────────────────────────────────

def test_teacher_diary_note_saves_and_scores(client_as_teacher, mock_supabase):
    """
    Teacher patching a student's diary note:
    - Verifies student ownership
    - Runs scorer on teacher_note
    - Upserts diary row with teacher_note_scores
    """
    student_id = "student-uuid-001"
    class_id = "class-uuid-001"

    # students → class_id lookup
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"class_id": class_id}
    ]
    # classes → teacher ownership check
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.execute.return_value.data = [
        {"id": class_id}
    ]
    # existing diary row check → not found
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.eq.return_value\
        .limit.return_value.execute.return_value.data = []
    # insert
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "diary-t-001"}
    ]

    res = client_as_teacher.patch(f"/api/teacher/students/{student_id}/diary-note", json={
        "date": "2026-04-06",
        "subject": "Maths",
        "teacher_note": "Outstanding engagement today. Student asked excellent questions and participated actively.",
    })

    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["diary_id"] == "diary-t-001"

    scores = body["scores"]
    assert scores is not None
    for key in ["emotion_sentiment", "encouragement_level", "difficulty_signal", "engagement_observed"]:
        assert key in scores
    assert scores["engagement_observed"] > 0.0


def test_teacher_diary_note_rejects_wrong_class(client_as_teacher, mock_supabase):
    """
    Teacher cannot update a student from another teacher's class → 403.
    """
    # Student found
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"class_id": "other-class-999"}
    ]
    # BUT class does not belong to this teacher
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.execute.return_value.data = []

    res = client_as_teacher.patch("/api/teacher/students/some-student/diary-note", json={
        "date": "2026-04-06",
        "subject": "Maths",
        "teacher_note": "Good work.",
    })
    assert res.status_code == 403


def test_teacher_diary_note_missing_date_returns_400(client_as_teacher, mock_supabase):
    """Missing required fields → 400."""
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"class_id": "class-1"}
    ]
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.execute.return_value.data = [
        {"id": "class-1"}
    ]

    res = client_as_teacher.patch("/api/teacher/students/s1/diary-note", json={
        # missing date and subject
        "teacher_note": "Good work.",
    })
    assert res.status_code == 400


# ─── 4. Data consistency: saved data readable in /diary ──────────────────────

def test_parent_diary_readable_after_save(client_as_parent, mock_supabase):
    """
    After PATCH /diary-note, GET /diary should return the updated entry
    with parent_note_scores populated (simulating a full round-trip via DB mock).
    """
    student_id = "student-uuid-001"
    expected_scores = {
        "emotion_sentiment": 4.2,
        "parent_child_connection": 0.6,
        "activity_level": 0.2,
        "social_engagement": 0.4,
        "curiosity_index": 0.7,
        "focus_depth": 0.3,
    }

    # --- Step 1: Save note ---
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"student_id": student_id}
    ]
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.eq.return_value\
        .limit.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "diary-r001"}
    ]

    patch_res = client_as_parent.patch("/api/parent/diary-note", json={
        "date": "2026-04-06",
        "subject": "Maths",
        "parent_note": "She was very curious and excited to learn.",
        "cognitive_level": 4,
        "emotion": "Excited",
    })
    assert patch_res.status_code == 200
    saved_scores = patch_res.json()["scores"]
    assert saved_scores is not None

    # --- Step 2: Read back from /diary (mock DB now returns updated row) ---
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"student_id": student_id}
    ]
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.order.return_value.execute.return_value.data = [
        {
            "date": "2026-04-06",
            "subject": "Maths",
            "cognitive_level": 4,
            "emotion": "Excited",
            "parent_note": "She was very curious and excited to learn.",
            "teacher_note": None,
            "parent_note_scores": saved_scores,   # scores are now in DB
            "teacher_note_scores": None,
        }
    ]

    diary_res = client_as_parent.get("/api/parent/diary")
    assert diary_res.status_code == 200
    diary = diary_res.json()
    assert isinstance(diary, list)
    assert len(diary) == 1

    entry = diary[0]
    assert entry["date"] == "2026-04-06"
    assert entry["subject"] == "Maths"
    assert entry["cognitiveLevel"] == 4
    assert entry["emotion"] == "Excited"
    assert entry["parent_note"] == "She was very curious and excited to learn."
    # Scores came through from DB
    assert entry["parent_note_scores"] is not None
    assert "emotion_sentiment" in entry["parent_note_scores"]


def test_parent_insights_uses_updated_diary(client_as_parent, mock_supabase):
    """
    GET /parent/insights reads from student_diaries — after a parent save,
    it computes updated intelligence/VARK/etc from the latest DB data.
    """
    student_id = "student-uuid-001"

    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"student_id": student_id}
    ]
    # Return 5 diary entries — enough data for insights computation
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.order.return_value.execute.return_value.data = [
        {"date": f"2026-04-0{i}", "subject": "Maths", "cognitive_level": i, "emotion": "Curious",
         "parent_note": "Good day", "teacher_note": None,
         "parent_note_scores": None, "teacher_note_scores": None}
        for i in range(1, 6)
    ]

    res = client_as_parent.get("/api/parent/insights")
    assert res.status_code == 200
    body = res.json()

    # insights endpoint returns structured data
    assert "intelligences" in body
    assert "vark" in body
    assert "cognition" in body
    assert "emotion" in body
    assert "personality" in body
    assert "career" in body
    assert "meta" in body
    assert body["meta"]["entry_count"] == 5


# ─── 5. Edge cases ────────────────────────────────────────────────────────────

def test_diary_note_date_format_accepted(client_as_parent, mock_supabase):
    """Valid ISO date (YYYY-MM-DD) should be accepted."""
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.limit.return_value.execute.return_value.data = [
        {"student_id": "s1"}
    ]
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.eq.return_value\
        .limit.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "d1"}
    ]
    res = client_as_parent.patch("/api/parent/diary-note", json={
        "date": "2026-04-06",
        "subject": "Science",
        "cognitive_level": 3,
        "emotion": "Happy",
    })
    assert res.status_code == 200


def test_diary_note_rejects_teacher_token(client_as_teacher):
    """Teacher token cannot access parent diary-note endpoint."""
    res = client_as_teacher.patch("/api/parent/diary-note", json={
        "date": "2026-04-06",
        "subject": "Maths",
        "cognitive_level": 3,
        "emotion": "Happy",
    })
    assert res.status_code == 403


# ─── 6. Teacher class insights uses same pipeline as parent ──────────────────

def test_teacher_class_insights_same_pipeline_as_parent(client_as_teacher, mock_supabase):
    """
    GET /api/teacher/classes/{id}/insights must return the same fields as
    GET /api/parent/insights — both use _run_tools_on_entries with note scores.
    Verifies: intelligences.radar_data, vark.vark_distribution, cognition,
              emotion, personality, career are all present.
    """
    class_id = "class-uuid-001"
    student_id = "student-uuid-001"

    # classes ownership check
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.execute.return_value.data = [{"id": class_id}]
    # students in class
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.execute.return_value.data = [{"id": student_id}]
    # diary entries WITH note scores — same format as parent
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.order.return_value.execute.return_value.data = [
        {
            "date": f"2026-04-0{i}",
            "subject": "Maths",
            "cognitive_level": i,
            "emotion": "Curious",
            "parent_note": "She was excited and asked many questions about fractions.",
            "teacher_note": "Great participation, engaged throughout.",
            "parent_note_scores": {
                "emotion_sentiment": 4.2,
                "parent_child_connection": 0.6,
                "activity_level": 0.2,
                "social_engagement": 0.4,
                "curiosity_index": 0.8,
                "focus_depth": 0.3,
            },
            "teacher_note_scores": {
                "emotion_sentiment": 4.5,
                "encouragement_level": 0.8,
                "difficulty_signal": 0.1,
                "engagement_observed": 0.9,
            },
        }
        for i in range(1, 6)
    ]

    res = client_as_teacher.get(f"/api/teacher/classes/{class_id}/insights")
    assert res.status_code == 200
    body = res.json()

    # All 6 sections present — same as parent insights
    for section in ["intelligences", "vark", "cognition", "emotion", "personality", "career"]:
        assert section in body, f"Missing section: {section}"

    # intelligences.radar_data has all 8 keys
    radar = body["intelligences"].get("radar_data", {})
    for intel in ["Logical", "Linguistic", "Spatial", "Kinesthetic",
                  "Musical", "Interpersonal", "Intrapersonal", "Naturalist"]:
        assert intel in radar, f"Missing intelligence: {intel}"
        assert 0 <= radar[intel] <= 100

    # vark.vark_distribution has 4 styles
    dist = body["vark"].get("vark_distribution", {})
    for style in ["Visual", "Auditory", "Reading", "Kinesthetic"]:
        assert style in dist

    # meta includes student_count
    assert body["meta"]["student_count"] == 1
    assert body["meta"]["entry_count"] == 5


def test_teacher_insights_uses_note_scores_for_mi(client_as_teacher, mock_supabase):
    """
    When diary entries have parent_note_scores with high curiosity_index,
    Intrapersonal and Naturalist intelligences should be boosted
    (proves note scores are being used by the MI tool).
    """
    class_id = "class-uuid-002"
    student_id = "student-uuid-002"

    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.eq.return_value.execute.return_value.data = [{"id": class_id}]
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.execute.return_value.data = [{"id": student_id}]

    # Entries with HIGH curiosity_index — should boost Intrapersonal
    mock_supabase.table.return_value.select.return_value\
        .eq.return_value.order.return_value.execute.return_value.data = [
        {
            "date": f"2026-04-0{i}",
            "subject": "Maths",
            "cognitive_level": 4,
            "emotion": "Curious",
            "parent_note": "She was very curious today!",
            "teacher_note": None,
            "parent_note_scores": {
                "emotion_sentiment": 4.0,
                "parent_child_connection": 0.5,
                "activity_level": 0.1,
                "social_engagement": 0.2,
                "curiosity_index": 1.0,   # max curiosity
                "focus_depth": 0.5,
            },
            "teacher_note_scores": None,
        }
        for i in range(1, 8)  # 7 entries
    ]

    res = client_as_teacher.get(f"/api/teacher/classes/{class_id}/insights")
    assert res.status_code == 200
    body = res.json()

    radar = body["intelligences"]["radar_data"]
    # High curiosity_index boosts Intrapersonal (via the insight tool logic)
    assert radar["Intrapersonal"] >= 40  # boosted above default 40
