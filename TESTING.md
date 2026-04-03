# Testing Guide

Read CLAUDE.md first.
Tests cover: backend REST endpoints + WebSocket handshake + frontend components.
DO NOT test agent/pipeline.py — agent is mocked and will be replaced.

---

## Backend Tests (pytest)

### Setup
```bash
cd backend
source venv/bin/activate
pip install pytest pytest-asyncio httpx
```

Run all tests:
```bash
pytest tests/ -v
```

---

## File: backend/tests/conftest.py
```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app

# Mock Supabase so tests don't need a real DB connection
@pytest.fixture(autouse=True)
def mock_supabase():
    with patch('db.supabase.get_supabase') as mock:
        db = MagicMock()
        # Default: return empty lists
        db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        db.table.return_value.insert.return_value.execute.return_value.data = [{"id": "test-uuid"}]
        db.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
        mock.return_value = db
        yield db

# Mock Clerk JWT verification
@pytest.fixture
def teacher_token():
    """Returns a mock Clerk JWT payload for a teacher."""
    return {
        "sub": "user_teacher_123",
        "role": "teacher",
        "email": "teacher@school.edu"
    }

@pytest.fixture
def parent_token():
    """Returns a mock Clerk JWT payload for a parent."""
    return {
        "sub": "user_parent_456",
        "role": "parent",
        "email": "parent@home.com"
    }

@pytest.fixture
def client_as_teacher(teacher_token):
    """TestClient with teacher auth bypass."""
    with patch('auth.verify_token', return_value=teacher_token):
        with patch('auth.require_teacher', return_value=teacher_token):
            yield TestClient(app)

@pytest.fixture
def client_as_parent(parent_token):
    """TestClient with parent auth bypass."""
    with patch('auth.verify_token', return_value=parent_token):
        with patch('auth.require_parent', return_value=parent_token):
            yield TestClient(app)

@pytest.fixture
def client_no_auth():
    """TestClient with no auth — for testing 401/403 cases."""
    yield TestClient(app)
```

---

## File: backend/tests/test_health.py
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
```

---

## File: backend/tests/test_teacher.py
```python
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
```

---

## File: backend/tests/test_parent.py
```python
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
```

---

## File: backend/tests/test_auth.py
```python
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
```

---

## Frontend Tests (Vitest + React Testing Library)

### Setup
```bash
cd frontend
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts'
  }
})
```

Create `src/tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
// Mock Clerk for all tests
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'test-user', publicMetadata: { role: 'teacher' } }, isLoaded: true }),
  useAuth: () => ({ getToken: async () => 'mock-token' }),
  ClerkProvider: ({ children }: any) => children,
  Show: ({ children, when }: any) => when === 'signed-in' ? children : null,
  UserButton: () => null,
  SignInButton: ({ children }: any) => children,
  SignUpButton: ({ children }: any) => children,
}))
// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}))
```

---

## File: frontend/src/tests/ComposeForm.test.tsx
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

// Simple mock for the compose form component
// Claude should create this component at: src/components/teacher/ComposeForm.tsx
// It renders: class dropdown, content type select, textarea, submit button

const mockSubmit = vi.fn().mockResolvedValue({ brief_id: 'brief-123', status: 'pending' })
vi.mock('@/lib/api', () => ({ useApi: () => ({ submitCompose: mockSubmit }) }))

// Import after mock
import ComposeForm from '@/components/teacher/ComposeForm'

describe('ComposeForm', () => {
  it('renders all form fields', () => {
    render(<ComposeForm classId="class-1" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()    // textarea
    expect(screen.getByRole('button', { name: /submit|send/i })).toBeInTheDocument()
  })

  it('disables submit when textarea is empty', () => {
    render(<ComposeForm classId="class-1" />)
    const btn = screen.getByRole('button', { name: /submit|send/i })
    expect(btn).toBeDisabled()
  })

  it('enables submit when textarea has content', async () => {
    render(<ComposeForm classId="class-1" />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'This week we are learning fractions' } })
    const btn = screen.getByRole('button', { name: /submit|send/i })
    expect(btn).not.toBeDisabled()
  })

  it('calls submitCompose on submit with correct data', async () => {
    render(<ComposeForm classId="class-1" />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'This week we are learning fractions' }
    })
    fireEvent.click(screen.getByRole('button', { name: /submit|send/i }))
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ raw_input: 'This week we are learning fractions', class_id: 'class-1' })
    ))
  })

  it('shows success message after submit', async () => {
    render(<ComposeForm classId="class-1" />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test content' } })
    fireEvent.click(screen.getByRole('button', { name: /submit|send/i }))
    await waitFor(() => expect(screen.getByText(/processing|submitted|pending/i)).toBeInTheDocument())
  })
})
```

---

## File: frontend/src/tests/NotificationCard.test.tsx
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationCard from '@/components/parent/NotificationCard'

// Claude should create this at: src/components/parent/NotificationCard.tsx
// Props: notification (Notification type), onRead, onFeedback

const mockNotification = {
  notification_id: 'notif-1',
  is_read: false,
  created_at: '2025-01-15T10:00:00Z',
  brief: {
    id: 'brief-1',
    content_type: 'assignment' as const,
    content: 'This week your child is learning fractions.',
    at_home_activities: [
      { title: 'Pizza fractions', description: 'Cut paper into 8 pieces', duration_mins: 10 }
    ],
    published_at: '2025-01-15T09:00:00Z',
    raw_input: '', subject: 'Math', year_level: 'Year 4', status: 'done' as const, created_at: ''
  }
}

describe('NotificationCard', () => {
  it('renders the brief content', () => {
    render(<NotificationCard notification={mockNotification} onRead={vi.fn()} onFeedback={vi.fn()} />)
    expect(screen.getByText(/fractions/i)).toBeInTheDocument()
  })

  it('renders at-home activities', () => {
    render(<NotificationCard notification={mockNotification} onRead={vi.fn()} onFeedback={vi.fn()} />)
    expect(screen.getByText(/Pizza fractions/i)).toBeInTheDocument()
    expect(screen.getByText(/10/)).toBeInTheDocument()   // duration
  })

  it('shows unread indicator when is_read is false', () => {
    render(<NotificationCard notification={mockNotification} onRead={vi.fn()} onFeedback={vi.fn()} />)
    expect(screen.getByTestId('unread-indicator')).toBeInTheDocument()
  })

  it('calls onRead when opened', () => {
    const onRead = vi.fn()
    render(<NotificationCard notification={mockNotification} onRead={onRead} onFeedback={vi.fn()} />)
    fireEvent.click(screen.getByText(/fractions/i))
    expect(onRead).toHaveBeenCalledWith('notif-1')
  })

  it('shows feedback form on reply click', () => {
    render(<NotificationCard notification={mockNotification} onRead={vi.fn()} onFeedback={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /reply|feedback/i }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
```

---

## Running Tests

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && pnpm test

# Frontend with UI
cd frontend && pnpm test:ui
```

Expected output (all passing):
```
Backend:
  PASSED tests/test_health.py::test_health_check
  PASSED tests/test_teacher.py::test_get_classes_returns_list
  PASSED tests/test_teacher.py::test_compose_returns_202
  ... (12 tests total)

Frontend:
  ✓ ComposeForm > renders all form fields
  ✓ ComposeForm > disables submit when empty
  ✓ ComposeForm > calls submitCompose on submit
  ✓ NotificationCard > renders the brief content
  ✓ NotificationCard > shows at-home activities
  ... (10 tests total)
```
