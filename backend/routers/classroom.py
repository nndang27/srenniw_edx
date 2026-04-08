import os
import re
import json
from datetime import datetime, date, timezone
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from db.supabase import get_supabase

router = APIRouter(prefix="/api/teacher/classroom", tags=["classroom"])

SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
    'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
]

TOKEN_PATH = '/Users/nndang27/Documents/hackathon_edx/token.json'
CREDENTIALS_PATH = '/Users/nndang27/Documents/hackathon_edx/credentials.json'


# ── Auth helpers ──────────────────────────────────────────────────────────────

def get_service(access_token: str | None = None):
    """
    Build Classroom service.
    If access_token is provided (starts with 'ya29.'), use it directly.
    Otherwise fall back to stored token.json.
    """
    if access_token and access_token.startswith('ya29.'):
        creds = Credentials(token=access_token)
        return build('classroom', 'v1', credentials=creds)

    creds = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                with open(TOKEN_PATH, 'w') as f:
                    f.write(creds.to_json())
            except RefreshError:
                raise HTTPException(
                    status_code=401,
                    detail="Google token expired. Please re-authenticate."
                )
        else:
            raise HTTPException(
                status_code=401,
                detail="Google Classroom not authenticated. Run test_google_api.py first."
            )
    return build('classroom', 'v1', credentials=creds)


# ── Week-mapping helpers ───────────────────────────────────────────────────────

def _load_weeks() -> list[dict]:
    """Fetch academic_weeks from Supabase, sorted by start_date."""
    db = get_supabase()
    result = db.table("academic_weeks").select("*").order("start_date").execute()
    return result.data or []


def _map_item_to_week_id(item: dict, weeks: list[dict]) -> str:
    """
    Map a Classroom item to an academic week_id.
    Priority:
    1. Parse [YYYY-WXX] from the title (e.g. [2025-W06])
    2. Use created_time date to find the matching week
    3. Use due_date as fallback
    4. Return the first week as last resort
    """
    # 1. Title-based parsing
    title = item.get('title', '') or ''
    match = re.search(r'\[(\d{4}-W\d{2})\]', title)
    if match:
        candidate = match.group(1)
        if any(w['id'] == candidate for w in weeks):
            return candidate

    # 2. Date-based: created_time then due_date
    for field in ('created_time', 'due_date'):
        ts = item.get(field)
        if not ts:
            continue
        try:
            dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            item_date = dt.date()
            for week in weeks:
                start = date.fromisoformat(week['start_date'])
                end = date.fromisoformat(week['end_date'])
                if start <= item_date <= end:
                    return week['id']
        except Exception:
            pass

    return weeks[0]['id'] if weeks else '2025-W06'


# ── Low-level Classroom fetch helpers ────────────────────────────────────────

def _paginate(request_fn):
    items = []
    page_token = None
    while True:
        resp = request_fn(page_token)
        if not resp:
            break
        for key in ['courses', 'courseWork', 'courseWorkMaterial', 'students', 'studentSubmissions']:
            if key in resp:
                items.extend(resp[key])
                break
        page_token = resp.get('nextPageToken')
        if not page_token:
            break
    return items


def _get_students(service, course_id: str) -> dict:
    students = {}
    page_token = None
    while True:
        resp = service.courses().students().list(
            courseId=course_id, pageToken=page_token, pageSize=100
        ).execute()
        for s in resp.get('students', []):
            uid = s['userId']
            profile = s.get('profile', {})
            students[uid] = {
                'name': profile.get('name', {}).get('fullName', ''),
                'email': profile.get('emailAddress', ''),
            }
        page_token = resp.get('nextPageToken')
        if not page_token:
            break
    return students


def _parse_due_date(due_date: dict, due_time: dict) -> str | None:
    if not due_date:
        return None
    try:
        y, m, d = due_date['year'], due_date['month'], due_date['day']
        h = due_time.get('hours', 0) if due_time else 0
        mi = due_time.get('minutes', 0) if due_time else 0
        return datetime(y, m, d, h, mi, tzinfo=timezone.utc).isoformat()
    except Exception:
        return None


def _get_submissions(service, course_id: str, cw_id: str, students: dict) -> list:
    subs = []
    page_token = None
    while True:
        resp = service.courses().courseWork().studentSubmissions().list(
            courseId=course_id, courseWorkId=cw_id,
            pageToken=page_token, pageSize=100
        ).execute()
        for sub in resp.get('studentSubmissions', []):
            uid = sub.get('userId', '')
            info = students.get(uid, {'name': '', 'email': ''})
            subs.append({
                'student_id': uid,
                'student_name': info['name'],
                'student_email': info['email'],
                'state': sub.get('state', ''),
                'late': sub.get('late', False),
                'assigned_grade': sub.get('assignedGrade'),
                'draft_grade': sub.get('draftGrade'),
                'submitted_at': sub.get('updateTime'),
            })
        page_token = resp.get('nextPageToken')
        if not page_token:
            break
    return subs


def _extract_attachments(materials_list: list) -> list:
    result = []
    for m in (materials_list or []):
        if 'driveFile' in m:
            f = m['driveFile'].get('driveFile', {})
            result.append({'type': 'drive_file', 'title': f.get('title', ''), 'url': f.get('alternateLink', '')})
        elif 'youtubeVideo' in m:
            v = m['youtubeVideo']
            result.append({'type': 'youtube', 'title': v.get('title', ''), 'url': v.get('alternateLink', '')})
        elif 'link' in m:
            l = m['link']
            result.append({'type': 'link', 'title': l.get('title', ''), 'url': l.get('url', '')})
        elif 'form' in m:
            fo = m['form']
            result.append({'type': 'form', 'title': fo.get('title', ''), 'url': fo.get('formUrl', '')})
    return result


# ── Sync logic: fetch from GC → save to DB ───────────────────────────────────

def _fetch_and_save(course_id: str, class_id: str, access_token: str | None = None) -> dict:
    """
    Fetch all materials + assignments from Google Classroom,
    map them to academic_weeks, upsert into course_items + student_submissions.
    Returns a curriculum dict compatible with /classes/{id}/curriculum.
    """
    service = get_service(access_token)
    db = get_supabase()
    weeks = _load_weeks()

    # Students roster
    try:
        students = _get_students(service, course_id)
    except HttpError:
        students = {}

    # ── Save / update students in DB ──────────────────────────────────────────
    for uid, info in students.items():
        db.table("students").upsert({
            "id": uid,
            "name": info['name'],
            "email": info['email'],
            "class_id": class_id,
        }, on_conflict="id").execute()

    # ── Fetch materials ───────────────────────────────────────────────────────
    raw_items = []
    try:
        page_token = None
        while True:
            resp = service.courses().courseWorkMaterials().list(
                courseId=course_id, pageToken=page_token, pageSize=100
            ).execute()
            for mat in resp.get('courseWorkMaterial', []):
                raw_items.append({
                    'id': mat['id'],
                    'type': 'material',
                    'title': mat.get('title', ''),
                    'description': mat.get('description', ''),
                    'state': mat.get('state', 'PUBLISHED'),
                    'work_type': None,
                    'max_points': None,
                    'created_time': mat.get('creationTime'),
                    'update_time': mat.get('updateTime'),
                    'due_date': None,
                    'scheduled_time': mat.get('scheduledTime'),
                    'attachments': _extract_attachments(mat.get('materials', [])),
                    'students': [],
                })
            page_token = resp.get('nextPageToken')
            if not page_token:
                break
    except HttpError:
        pass

    # ── Fetch assignments ─────────────────────────────────────────────────────
    try:
        page_token = None
        while True:
            resp = service.courses().courseWork().list(
                courseId=course_id, pageToken=page_token, pageSize=100
            ).execute()
            for cw in resp.get('courseWork', []):
                subs = _get_submissions(service, course_id, cw['id'], students)
                raw_items.append({
                    'id': cw['id'],
                    'type': 'assignment',
                    'title': cw.get('title', ''),
                    'description': cw.get('description', ''),
                    'state': cw.get('state', 'PUBLISHED'),
                    'work_type': cw.get('workType', 'ASSIGNMENT'),
                    'max_points': cw.get('maxPoints'),
                    'created_time': cw.get('creationTime'),
                    'update_time': cw.get('updateTime'),
                    'due_date': _parse_due_date(cw.get('dueDate'), cw.get('dueTime')),
                    'scheduled_time': cw.get('scheduledTime'),
                    'attachments': _extract_attachments(cw.get('materials', [])),
                    'students': subs,
                })
            page_token = resp.get('nextPageToken')
            if not page_token:
                break
    except HttpError:
        pass

    # ── Upsert course_items and student_submissions ───────────────────────────
    student_map = {uid: info['name'] for uid, info in students.items()}
    materials_out, assignments_out = [], []

    for item in raw_items:
        week_id = _map_item_to_week_id(item, weeks)

        db_row = {
            "id": item['id'],
            "class_id": class_id,
            "week_id": week_id,
            "type": item['type'],
            "title": item['title'],
            "description": item.get('description', ''),
            "state": item.get('state', 'PUBLISHED'),
            "work_type": item.get('work_type'),
            "max_points": item.get('max_points'),
            "attachments": item.get('attachments', []),
            "scheduled_time": item.get('scheduled_time'),
            "due_date": item.get('due_date'),
            "created_time": item.get('created_time'),
            "update_time": item.get('update_time'),
        }

        db.table("course_items").upsert(db_row, on_conflict="id").execute()

        # Save submissions
        subs_formatted = []
        if item['type'] == 'assignment':
            for sub in item['students']:
                sid = sub['student_id']
                # Ensure student exists before inserting submission (handles edge cases)
                if sid not in students:
                    db.table("students").upsert({
                        "id": sid,
                        "name": sub.get('student_name', sid),
                        "email": sub.get('student_email', ''),
                        "class_id": class_id,
                    }, on_conflict="id").execute()
                try:
                    db.table("student_submissions").upsert({
                        "item_id": item['id'],
                        "student_id": sid,
                        "state": sub['state'],
                        "late": sub.get('late', False),
                        "assigned_grade": sub.get('assigned_grade'),
                        "draft_grade": sub.get('draft_grade'),
                        "submitted_at": sub.get('submitted_at'),
                    }, on_conflict="item_id,student_id").execute()
                except Exception:
                    pass  # skip submission if FK still fails
                subs_formatted.append({
                    **sub,
                    "student_name": student_map.get(sub['student_id'], sub.get('student_name', '')),
                })

        graded = [s for s in subs_formatted if s.get('assigned_grade') is not None]
        turned_in = len([s for s in subs_formatted if s.get('state') in ('TURNED_IN', 'RETURNED')])
        submission_summary = None
        if item['type'] == 'assignment':
            submission_summary = {
                "total": len(subs_formatted),
                "turned_in": turned_in,
                "graded": len(graded),
                "avg_grade": round(sum(s['assigned_grade'] for s in graded) / len(graded), 1) if graded else None,
            }

        formatted = {
            "id": item['id'],
            "type": item['type'],
            "title": item['title'],
            "description": item.get('description', ''),
            "state": item.get('state', 'PUBLISHED'),
            "created_time": item.get('created_time'),
            "update_time": item.get('update_time'),
            "due_date": item.get('due_date'),
            "max_points": item.get('max_points'),
            "attachments": item.get('attachments', []),
            "students": subs_formatted,
            "submission_summary": submission_summary,
            "week_id": week_id,
        }
        if item['type'] == 'material':
            materials_out.append(formatted)
        else:
            assignments_out.append(formatted)

    # ── Update class fetched_at ───────────────────────────────────────────────
    db.table("classes").update({
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "course_id": course_id,
    }).eq("id", class_id).execute()

    # ── Build weekly_topics from materials ───────────────────────────────────
    # Sort weeks by start_date and build week_num map
    sorted_weeks = sorted(weeks, key=lambda w: w['start_date'])
    week_num_map = {w['id']: (i + 1) for i, w in enumerate(sorted_weeks)}
    week_name_map = {w['id']: w['week_name'] for w in sorted_weeks}

    # Group materials by week_id → use first material title as weekly topic
    seen_week_topics: dict[str, dict] = {}
    for mat in materials_out:
        wid = mat.get('week_id', '')
        if wid not in seen_week_topics:
            # Clean up the display title: strip [YYYY-WXX] prefix, "Week N:" prefix, and "— Lesson Plan" suffix
            raw_title = mat['title']
            clean = re.sub(r'^\[\d{4}-W\d{2}\]\s*', '', raw_title)   # remove [2025-W06]
            clean = re.sub(r'^Week\s+\d+:\s*', '', clean)             # remove "Week 1: "
            clean = re.sub(r'\s*—\s*(Lesson Plan|Homework)$', '', clean)  # remove suffix
            clean = clean.strip()
            seen_week_topics[wid] = {
                "week": week_num_map.get(wid, 1),
                "week_id": wid,
                "week_name": week_name_map.get(wid, wid),
                "subject": "Maths",
                "topic": clean or raw_title,
                "learningGoal": (mat.get('description') or '')[:300],
            }

    weekly_topics = sorted(seen_week_topics.values(), key=lambda x: x['week'])

    all_items = materials_out + assignments_out
    all_items.sort(key=lambda x: x.get('created_time') or '', reverse=True)

    return {
        "course_id": course_id,
        "student_count": len(students),
        "materials": materials_out,
        "assignments": assignments_out,
        "items": all_items,
        "weekly_topics": weekly_topics,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

class ConnectRequest(BaseModel):
    class_id: str
    provider: str
    token: str = ""


@router.post("/connect")
def connect_lms(body: ConnectRequest):
    """
    Connect to Google Classroom, fetch all items, and sync them to the DB.
    Returns curriculum data identical to GET /classes/{id}/curriculum.
    """
    if body.provider.lower() not in ("google classroom", "google_classroom", "google"):
        raise HTTPException(status_code=400, detail=f"Provider '{body.provider}' not supported in test mode. Use 'Google Classroom'.")

    db = get_supabase()
    cls = db.table("classes").select("id, course_id").eq("id", body.class_id).execute()
    if not cls.data:
        raise HTTPException(status_code=404, detail="Class not found")

    course_id = cls.data[0].get("course_id")
    if not course_id:
        raise HTTPException(status_code=400, detail="This class has no Google Classroom course_id configured.")

    access_token = body.token.strip() if body.token else None
    data = _fetch_and_save(course_id, body.class_id, access_token)
    return data


@router.get("/courses")
def list_courses():
    service = get_service()
    resp = service.courses().list(pageSize=50).execute()
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "section": c.get("section", ""),
            "state": c.get("courseState", ""),
        }
        for c in resp.get("courses", [])
    ]


@router.get("/courses/{course_id}/items")
def get_course_items(course_id: str):
    service = get_service()

    try:
        students = _get_students(service, course_id)
    except HttpError:
        students = {}

    materials = []
    try:
        page_token = None
        while True:
            resp = service.courses().courseWorkMaterials().list(
                courseId=course_id, pageToken=page_token, pageSize=100
            ).execute()
            for mat in resp.get('courseWorkMaterial', []):
                materials.append({
                    'id': mat['id'],
                    'type': 'material',
                    'title': mat.get('title', ''),
                    'description': mat.get('description', ''),
                    'state': mat.get('state', ''),
                    'created_time': mat.get('creationTime'),
                    'update_time': mat.get('updateTime'),
                    'due_date': None,
                    'max_points': None,
                    'attachments': _extract_attachments(mat.get('materials', [])),
                    'students': [],
                    'submission_summary': None,
                })
            page_token = resp.get('nextPageToken')
            if not page_token:
                break
    except HttpError:
        pass

    assignments = []
    try:
        page_token = None
        while True:
            resp = service.courses().courseWork().list(
                courseId=course_id, pageToken=page_token, pageSize=100
            ).execute()
            for cw in resp.get('courseWork', []):
                subs = _get_submissions(service, course_id, cw['id'], students)
                graded = [s for s in subs if s['assigned_grade'] is not None]
                avg_grade = round(sum(s['assigned_grade'] for s in graded) / len(graded), 1) if graded else None
                turned_in = len([s for s in subs if s['state'] in ('TURNED_IN', 'RETURNED')])
                assignments.append({
                    'id': cw['id'],
                    'type': 'assignment',
                    'title': cw.get('title', ''),
                    'description': cw.get('description', ''),
                    'state': cw.get('state', ''),
                    'created_time': cw.get('creationTime'),
                    'update_time': cw.get('updateTime'),
                    'due_date': _parse_due_date(cw.get('dueDate'), cw.get('dueTime')),
                    'max_points': cw.get('maxPoints'),
                    'attachments': _extract_attachments(cw.get('materials', [])),
                    'students': subs,
                    'submission_summary': {
                        'total': len(subs),
                        'turned_in': turned_in,
                        'graded': len(graded),
                        'avg_grade': avg_grade,
                    },
                })
            page_token = resp.get('nextPageToken')
            if not page_token:
                break
    except HttpError:
        pass

    all_items = materials + assignments
    all_items.sort(key=lambda x: x.get('created_time') or '', reverse=True)

    return {
        'course_id': course_id,
        'student_count': len(students),
        'materials': materials,
        'assignments': assignments,
        'items': all_items,
    }
