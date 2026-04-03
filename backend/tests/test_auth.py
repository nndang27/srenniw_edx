from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_no_token_returns_403():
    res = client.get("/api/teacher/classes")
    assert res.status_code == 403

def test_no_token_parent_returns_403():
    res = client.get("/api/parent/inbox")
    assert res.status_code == 403

def test_wrong_role_teacher_route_returns_403(client_as_parent):
    res = client_as_parent.get("/api/teacher/classes")
    assert res.status_code == 403

def test_wrong_role_parent_route_returns_403(client_as_teacher):
    res = client_as_teacher.get("/api/parent/inbox")
    assert res.status_code == 403
