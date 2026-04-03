import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app
import auth

def make_mock_db():
    db = MagicMock()
    # Default: return empty lists / counts
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.count = 0
    db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
    db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.count = 0
    db.table.return_value.insert.return_value.execute.return_value.data = [{"id": "test-uuid"}]
    db.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
    db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
    return db

# Mock Supabase in ALL router modules so tests don't need a real DB connection
@pytest.fixture(autouse=True)
def mock_supabase():
    db = make_mock_db()
    # Patch the reference in each module that imports get_supabase
    patches = [
        patch('routers.teacher.get_supabase', return_value=db),
        patch('routers.parent.get_supabase', return_value=db),
        patch('routers.chat.get_supabase', return_value=db),
    ]
    for p in patches:
        p.start()
    yield db
    for p in patches:
        p.stop()

TEACHER_PAYLOAD = {"sub": "user_teacher_123", "role": "teacher", "email": "teacher@school.edu"}
PARENT_PAYLOAD  = {"sub": "user_parent_456",  "role": "parent",  "email": "parent@home.com"}

@pytest.fixture
def teacher_token():
    return TEACHER_PAYLOAD

@pytest.fixture
def parent_token():
    return PARENT_PAYLOAD

@pytest.fixture
def client_as_teacher():
    """TestClient with teacher auth bypass using dependency overrides."""
    from fastapi import HTTPException
    app.dependency_overrides[auth.verify_token]    = lambda: TEACHER_PAYLOAD
    app.dependency_overrides[auth.require_teacher] = lambda: TEACHER_PAYLOAD
    app.dependency_overrides[auth.require_parent]  = lambda: (_ for _ in ()).throw(
        HTTPException(status_code=403, detail="Parent access required"))
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def client_as_parent():
    """TestClient with parent auth bypass using dependency overrides."""
    from fastapi import HTTPException
    app.dependency_overrides[auth.verify_token]    = lambda: PARENT_PAYLOAD
    app.dependency_overrides[auth.require_parent]  = lambda: PARENT_PAYLOAD
    app.dependency_overrides[auth.require_teacher] = lambda: (_ for _ in ()).throw(
        HTTPException(status_code=403, detail="Teacher access required"))
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def client_no_auth():
    """TestClient with no auth — for testing 401/403 cases."""
    app.dependency_overrides.clear()
    yield TestClient(app)
