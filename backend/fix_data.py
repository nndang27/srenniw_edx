"""
fix_data.py — Đọc toàn bộ data từ Supabase, phân tích quan hệ,
rồi regenerate lại sao cho tất cả foreign key khớp nhau.

Chạy: python fix_data.py
"""

import os, sys, uuid, random, json
from datetime import date, timedelta
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not URL or not KEY:
    sys.exit("❌  SUPABASE_URL hoặc SUPABASE_SERVICE_KEY chưa set trong .env")

db = create_client(URL, KEY)

# ─── 1. Đọc toàn bộ data hiện tại ────────────────────────────────────────────

def fetch(table):
    rows = db.table(table).select("*").execute().data
    print(f"  {table}: {len(rows)} rows")
    return rows

print("\n📥  Đang đọc data từ Supabase...")
classes        = fetch("classes")
students       = fetch("students")
family_profiles= fetch("family_profiles")
class_parents  = fetch("class_parents")
course_items   = fetch("course_items")
student_subs   = fetch("student_submissions")
student_diaries= fetch("student_diaries")
briefs         = fetch("briefs")
notifications  = fetch("notifications")
translations   = fetch("translations")
chat_rooms     = fetch("chat_rooms")
chat_messages  = fetch("chat_messages")

# ─── 2. Phân tích tình trạng ──────────────────────────────────────────────────

print("\n🔍  Phân tích quan hệ...")

class_ids      = {c["id"] for c in classes}
student_ids    = {s["id"] for s in students}
student_class  = {s["id"]: s.get("class_id") for s in students}

# students có class_id không tồn tại
orphan_students = [s for s in students if s.get("class_id") not in class_ids]
print(f"  students không có class hợp lệ: {len(orphan_students)}")

# family_profiles có student_id không tồn tại
orphan_fp = [f for f in family_profiles if f.get("student_id") not in student_ids]
print(f"  family_profiles không có student hợp lệ: {len(orphan_fp)}")

# student_diaries có student_id không tồn tại
orphan_diaries = [d for d in student_diaries if d.get("student_id") not in student_ids]
print(f"  student_diaries không có student hợp lệ: {len(orphan_diaries)}")

# class_parents có class_id không tồn tại
orphan_cp = [cp for cp in class_parents if cp.get("class_id") not in class_ids]
print(f"  class_parents không có class hợp lệ: {len(orphan_cp)}")

# ─── 3. Xác nhận trước khi sửa ───────────────────────────────────────────────

print(f"\n📋  Tóm tắt:")
print(f"  Classes: {len(classes)}")
for c in classes:
    sc = [s for s in students if s.get("class_id") == c["id"]]
    print(f"    • {c['name']} ({c['id'][:8]}…) — {len(sc)} students")

print(f"\n  Sẽ thực hiện:")
print(f"  1. Gán lại class_id cho {len(orphan_students)} orphan students")
print(f"  2. Fix student_id cho {len(orphan_fp)} orphan family_profiles")
print(f"  3. Fix student_id cho {len(orphan_diaries)} orphan student_diaries")
print(f"  4. Đảm bảo mỗi student có ít nhất 1 family_profile")
print(f"  5. Đảm bảo mỗi student có diary entries")
print(f"  6. Fix class_parents để khớp với students/classes")

ans = input("\n▶  Tiếp tục? (y/n): ").strip().lower()
if ans != "y":
    print("Cancelled.")
    sys.exit(0)

# ─── 4. Fix orphan students → gán vào class đầu tiên ────────────────────────

if orphan_students and classes:
    print("\n🔧  Fixing orphan students...")
    # Phân phối đều vào các class
    for i, s in enumerate(orphan_students):
        target_class = classes[i % len(classes)]["id"]
        db.table("students").update({"class_id": target_class}).eq("id", s["id"]).execute()
        print(f"  ✓ student {s['id'][:8]}… → class {target_class[:8]}…")

    # Reload students
    students = db.table("students").select("*").execute().data
    student_ids = {s["id"] for s in students}
    student_class = {s["id"]: s.get("class_id") for s in students}

# ─── 5. Đảm bảo mỗi class có ít nhất 5 students ─────────────────────────────

SUBJECTS = ["Mathematics", "Science", "English", "HSIE", "Creative Arts", "PE"]
NAMES = [
    "Emma Johnson", "Liam Smith", "Olivia Brown", "Noah Wilson", "Ava Davis",
    "Lucas Miller", "Isabella Moore", "Mason Taylor", "Sophia Anderson", "Ethan Thomas",
    "Mia Jackson", "James White", "Charlotte Harris", "Benjamin Martin", "Amelia Garcia",
    "Oliver Martinez", "Harper Robinson", "Elijah Clark", "Evelyn Lewis", "Logan Lee",
]

print("\n🔧  Đảm bảo mỗi class có đủ students...")
new_students = []
for c in classes:
    existing = [s for s in students if s.get("class_id") == c["id"]]
    needed = max(0, 5 - len(existing))
    if needed > 0:
        print(f"  Class {c['name']}: thêm {needed} students")
        name_pool = [n for n in NAMES if n not in {s["name"] for s in existing}]
        random.shuffle(name_pool)
        for j in range(needed):
            name = name_pool[j % len(name_pool)] if name_pool else f"Student {uuid.uuid4().hex[:4]}"
            row = db.table("students").insert({
                "name": name,
                "class_id": c["id"],
            }).execute().data[0]
            new_students.append(row)
            print(f"    ✓ Created: {name}")

# Reload
students = db.table("students").select("*").execute().data
student_ids = {s["id"] for s in students}
student_class = {s["id"]: s.get("class_id") for s in students}

# ─── 6. Fix orphan family_profiles ───────────────────────────────────────────

if orphan_fp:
    print(f"\n🔧  Fixing {len(orphan_fp)} orphan family_profiles...")
    valid_students = list(student_ids)
    for i, fp in enumerate(orphan_fp):
        target = valid_students[i % len(valid_students)]
        db.table("family_profiles").update({"student_id": target}).eq("id", fp["id"]).execute()
        print(f"  ✓ family_profile {fp['id'][:8]}… → student {target[:8]}…")

# ─── 7. Đảm bảo mỗi student có family_profile ───────────────────────────────

print("\n🔧  Đảm bảo mỗi student có family_profile...")
fp_by_student = {}
family_profiles = db.table("family_profiles").select("*").execute().data
for fp in family_profiles:
    fp_by_student.setdefault(fp.get("student_id"), []).append(fp)

PARENT_NAMES = [
    "Sarah Johnson", "Michael Smith", "Jennifer Brown", "David Wilson", "Lisa Davis",
    "Robert Miller", "Mary Moore", "James Taylor", "Patricia Anderson", "John Thomas",
]
LANGUAGES = ["en", "vi", "zh", "ar"]

for s in students:
    if s["id"] not in fp_by_student:
        parent_name = random.choice(PARENT_NAMES)
        lang = random.choice(LANGUAGES)
        db.table("family_profiles").insert({
            "student_id": s["id"],
            "parent_name": parent_name,
            "preferred_language": lang,
        }).execute()
        print(f"  ✓ Created family_profile for student {s['name']}")

# ─── 8. Fix orphan student_diaries ───────────────────────────────────────────

if orphan_diaries:
    print(f"\n🔧  Fixing {len(orphan_diaries)} orphan student_diaries...")
    valid_students = list(student_ids)
    for i, d in enumerate(orphan_diaries):
        target = valid_students[i % len(valid_students)]
        db.table("student_diaries").update({"student_id": target}).eq("id", d["id"]).execute()
    print(f"  ✓ Done")

# ─── 9. Đảm bảo mỗi student có diary entries ─────────────────────────────────

print("\n🔧  Đảm bảo mỗi student có diary entries...")
diaries = db.table("student_diaries").select("*").execute().data
diary_by_student = {}
for d in diaries:
    diary_by_student.setdefault(d.get("student_id"), []).append(d)

EMOTIONS = ["Happy", "Curious", "Excited", "Anxious", "Disengaged"]
COGNITIVE_LEVELS = [1, 2, 3, 4, 5]
TODAY = date.today()

for s in students:
    existing_count = len(diary_by_student.get(s["id"], []))
    if existing_count < 7:
        needed = 7 - existing_count
        class_id = student_class.get(s["id"])
        cls = next((c for c in classes if c["id"] == class_id), None)
        subject = cls.get("subject", "Mathematics") if cls else "Mathematics"
        print(f"  Adding {needed} diary entries for {s['name']}")
        for k in range(needed):
            entry_date = TODAY - timedelta(days=k * 2)
            db.table("student_diaries").insert({
                "student_id": s["id"],
                "date": entry_date.isoformat(),
                "subject": subject,
                "topic": f"Week {k+1} — {subject} lesson",
                "cognitive_level": random.choice(COGNITIVE_LEVELS),
                "emotion": random.choice(EMOTIONS),
                "notes": f"Student engaged with {subject.lower()} activities.",
                "is_school_day": True,
            }).execute()

# ─── 10. Fix class_parents ────────────────────────────────────────────────────

print("\n🔧  Rebuilding class_parents...")
# Xoá class_parents không hợp lệ
for cp in orphan_cp:
    db.table("class_parents").delete().eq("id", cp["id"]).execute()

# Đảm bảo mỗi student có family_profile linked vào class_parents
family_profiles = db.table("family_profiles").select("*").execute().data
class_parents   = db.table("class_parents").select("*").execute().data
existing_cp = {(cp.get("class_id"), cp.get("parent_clerk_id")) for cp in class_parents}

for fp in family_profiles:
    sid = fp.get("student_id")
    cid = student_class.get(sid)
    if not cid:
        continue
    parent_clerk_id = fp.get("parent_clerk_id") or f"parent_{fp['id'][:8]}"
    key = (cid, parent_clerk_id)
    if key not in existing_cp:
        db.table("class_parents").insert({
            "class_id": cid,
            "parent_clerk_id": parent_clerk_id,
            "student_id": sid,
        }).execute()
        existing_cp.add(key)

# ─── 11. Summary ──────────────────────────────────────────────────────────────

print("\n✅  Done! Kết quả sau khi fix:")
for c in classes:
    sc = db.table("students").select("id").eq("class_id", c["id"]).execute().data
    print(f"  {c['name']}: {len(sc)} students")

print("\n🎉  Database đã được fix xong. Restart backend và refresh UI!")
