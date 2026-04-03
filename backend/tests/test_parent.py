def test_get_inbox_returns_structure(client_as_parent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value\
        .limit.return_value.execute.return_value.data = [
        {"preferred_language": "vi"}
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value\
        .order.return_value.range.return_value.execute.return_value.data = []
    mock_supabase.table.return_value.select.return_value.eq.return_value\
        .eq.return_value.execute.return_value.count = 0

    res = client_as_parent.get("/api/parent/inbox")
    assert res.status_code == 200
    body = res.json()
    assert "unread_count" in body
    assert "items" in body
    assert isinstance(body["items"], list)


def test_inbox_rejects_teacher(client_as_teacher):
    res = client_as_teacher.get("/api/parent/inbox")
    assert res.status_code == 403


def test_submit_feedback_201(client_as_parent, mock_supabase):
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "fb-1", "created_at": "2025-01-01"}
    ]
    res = client_as_parent.post("/api/parent/feedback", json={
        "brief_id": "00000000-0000-0000-0000-000000000001",
        "message": "My child understood the first activity"
    })
    assert res.status_code == 201


def test_update_language(client_as_parent, mock_supabase):
    res = client_as_parent.patch("/api/parent/profile", json={"preferred_language": "vi"})
    assert res.status_code == 200
    assert res.json()["preferred_language"] == "vi"


def test_update_language_invalid(client_as_parent):
    res = client_as_parent.patch("/api/parent/profile", json={"preferred_language": "klingon"})
    assert res.status_code == 422


def test_mark_notification_read(client_as_parent, mock_supabase):
    res = client_as_parent.patch("/api/parent/inbox/notif-1/read")
    assert res.status_code == 200
    assert res.json()["is_read"] == True
