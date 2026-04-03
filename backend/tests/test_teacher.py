import pytest
from unittest.mock import patch, MagicMock


def test_get_classes_returns_list(client_as_teacher, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": "class-1", "name": "4B - Mathematics", "year_level": "Year 4", "subject": "Mathematics"}
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.count = 5

    res = client_as_teacher.get("/api/teacher/classes")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_get_classes_requires_auth(client_no_auth):
    res = client_no_auth.get("/api/teacher/classes")
    assert res.status_code == 403


def test_compose_returns_202(client_as_teacher):
    with patch('routers.teacher.run_agent_pipeline'):  # don't run real agent
        res = client_as_teacher.post("/api/teacher/compose", json={
            "class_id": "00000000-0000-0000-0000-000000000001",
            "content_type": "assignment",
            "raw_input": "This week we are learning fractions.",
            "subject": "Mathematics",
            "year_level": "Year 4"
        })
    assert res.status_code == 202
    body = res.json()
    assert body["status"] == "pending"
    assert "brief_id" in body


def test_compose_validates_content_type(client_as_teacher):
    with patch('routers.teacher.run_agent_pipeline'):
        res = client_as_teacher.post("/api/teacher/compose", json={
            "class_id": "00000000-0000-0000-0000-000000000001",
            "content_type": "invalid_type",   # not in enum
            "raw_input": "Test",
            "subject": "Math",
            "year_level": "Year 4"
        })
    assert res.status_code == 422   # Pydantic validation error


def test_compose_rejects_parent(client_as_parent):
    res = client_as_parent.post("/api/teacher/compose", json={
        "class_id": "00000000-0000-0000-0000-000000000001",
        "content_type": "assignment",
        "raw_input": "Test",
        "subject": "Math",
        "year_level": "Year 4"
    })
    assert res.status_code == 403


def test_get_briefs_returns_list(client_as_teacher, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value\
        .order.return_value.range.return_value.execute.return_value.data = [
        {"id": "brief-1", "status": "done", "raw_input": "Test brief", "content_type": "assignment"}
    ]
    res = client_as_teacher.get("/api/teacher/briefs")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_get_brief_feedback(client_as_teacher, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value\
        .order.return_value.execute.return_value.data = [
        {"id": "fb-1", "message": "My child struggled", "created_at": "2025-01-01"}
    ]
    res = client_as_teacher.get("/api/teacher/briefs/brief-1/feedback")
    assert res.status_code == 200
    body = res.json()
    assert "messages" in body
    assert body["total_feedback"] == 1


def test_create_class(client_as_teacher, mock_supabase):
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "class-new", "name": "5A - English", "year_level": "Year 5", "subject": "English"}
    ]
    res = client_as_teacher.post("/api/teacher/classes", json={
        "name": "5A - English",
        "year_level": "Year 5",
        "subject": "English"
    })
    assert res.status_code == 201
