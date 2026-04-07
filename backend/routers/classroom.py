import os
import json
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

from fastapi import APIRouter, HTTPException
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

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


def get_service():
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
                    detail="Google token expired. Re-run test_google_api.py to re-authenticate."
                )
        else:
            raise HTTPException(
                status_code=401,
                detail="Google Classroom not authenticated. Run test_google_api.py first."
            )
    return build('classroom', 'v1', credentials=creds)


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
        from datetime import datetime, timezone
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


# ── Endpoints ────────────────────────────────────────────────────────────────

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

    # Students roster
    try:
        students = _get_students(service, course_id)
    except HttpError:
        students = {}

    # Materials (giáo án)
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
    except HttpError as e:
        pass  # no materials permission

    # Assignments (bài tập về nhà)
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
                avg_grade = (
                    round(sum(s['assigned_grade'] for s in graded) / len(graded), 1)
                    if graded else None
                )
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
