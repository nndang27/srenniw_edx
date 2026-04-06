"""
Generate 400-day mock journal dataset for student "Minh An" (age 9, Year 4).

Usage:
    cd backend
    python -m tests.data.generate_mock_400days

Output:
    backend/tests/data/mock_data_400days.json

Dataset design:
  400 consecutive days starting 2025-01-01
  School days (Mon–Fri): 1–3 subject entries
  Weekend days: parent note + emotion only (no subject/cognitiveLevel)

Phases (for realistic variance):
  Phase 1 [days 001–120]:  Plateau   — avg Bloom 2.5–3.0, mixed emotions
  Phase 2 [days 121–260]:  Growth    — avg Bloom 3.2–4.0, mostly positive
  Phase 3 [days 261–330]:  Stress    — avg Bloom 2.8–3.2, anxious peaks
  Phase 4 [days 331–400]:  Recovery  — avg Bloom 3.8–4.5, strong positive

Each entry includes pre-scored note dimensions via score_note_fast.
"""
import json
import random
import sys
import os
import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from agent.tools.insights.note_scorer import score_note_fast

# ─── Constants ────────────────────────────────────────────────────────────────

random.seed(42)

START_DATE  = datetime.date(2025, 1, 1)
TOTAL_DAYS  = 400
SUBJECTS    = ["Maths", "English", "Science", "PE", "Creative Arts", "HSIE"]
EMOTIONS    = ["Excited", "Happy", "Curious", "Neutral", "Anxious", "Disengaged"]

# Subject schedule frequency (some subjects appear more often)
SUBJECT_WEIGHTS = {
    "Maths": 5, "English": 5, "Science": 3,
    "PE": 3, "Creative Arts": 2, "HSIE": 2,
}

# ─── Phase configuration ──────────────────────────────────────────────────────

def get_phase(day_index: int) -> dict:
    """Return phase config for this day."""
    if day_index < 120:   # Phase 1: Plateau
        return {
            "bloom_mean": 2.6, "bloom_std": 0.6,
            "emotion_weights": [0.12, 0.18, 0.20, 0.28, 0.12, 0.10],  # more neutral/anxious
        }
    elif day_index < 260:  # Phase 2: Growth
        return {
            "bloom_mean": 3.5, "bloom_std": 0.7,
            "emotion_weights": [0.20, 0.28, 0.22, 0.18, 0.07, 0.05],  # mostly positive
        }
    elif day_index < 330:  # Phase 3: Exam stress
        return {
            "bloom_mean": 3.0, "bloom_std": 0.8,
            "emotion_weights": [0.08, 0.12, 0.15, 0.25, 0.25, 0.15],  # anxious peak
        }
    else:                  # Phase 4: Recovery
        return {
            "bloom_mean": 4.0, "bloom_std": 0.6,
            "emotion_weights": [0.28, 0.30, 0.22, 0.12, 0.05, 0.03],  # strong positive
        }

# ─── Note pools ───────────────────────────────────────────────────────────────

PARENT_NOTES_BY_EMOTION = {
    "Excited": [
        "Bé về nhà hát bài học thuộc lòng, nói hôm nay cô khen",
        "Bé rất hào hứng kể về thí nghiệm trồng cây ở lớp, tự muốn trồng thêm ở nhà",
        "Bé chạy vào nhà la to 'con được 10 điểm toán rồi!', rất tự hào",
        "Extremely excited about the PE relay race, told the whole story at dinner",
        "Bé đọc hết quyển truyện trong một buổi chiều, hỏi mua thêm sách mới",
        "Very enthusiastic about art class today, showed me the painting with pride",
        "Bé tự ngồi làm bài tập thêm không cần nhắc, nói muốn giỏi hơn",
    ],
    "Happy": [
        "Bé vui vẻ, kể chuyện cùng bạn chơi bóng giờ ra chơi",
        "Hôm nay bé ăn cơm ngon, kể chuyện trường rất nhiều",
        "Bé nhường đồ chơi cho em, cả hai cùng vẽ tranh",
        "Had a great day, made a new friend named Minh who sits next to her",
        "Bé cùng bố đọc sách tối, hỏi nghĩa nhiều từ mới",
        "Enjoyed cooking dinner together, asked lots of questions about ingredients",
        "Bé chia bánh với hàng xóm, rất tự nhiên và vui vẻ",
    ],
    "Curious": [
        "Bé hỏi tại sao trời có màu xanh, tìm kiếm trên máy tính cùng bố",
        "Asked me why fractions are used in cooking — we tried halving a recipe together",
        "Bé tò mò về con kiến, ngồi quan sát cả tiếng đồng hồ ngoài vườn",
        "Bé lật xem hết cuốn sách bách khoa về vũ trụ, hỏi rất nhiều câu",
        "Tự vẽ sơ đồ tư duy về bài khoa học, muốn tìm hiểu thêm",
        "Curious about how bridges are built after seeing one on TV, drew designs",
        "Bé khám phá ứng dụng toán học trên tablet, tự tìm ra cách giải mới",
    ],
    "Neutral": [
        "Ngày bình thường, bé về nhà làm bài rồi xem TV",
        "Bé ổn, không có gì đặc biệt hôm nay",
        "Ordinary day, completed homework without fuss",
        "Bé ăn bình thường, ngủ sớm, không kể nhiều về trường",
        "Quiet afternoon, did some drawing and then played games",
        "Bé tự chơi một mình khá lâu, không cần ba mẹ nhiều",
        "Nothing notable today — just a regular school day",
    ],
    "Anxious": [
        "Bé khóc vì không làm được bài toán chia, nói không hiểu",
        "Very worried about the spelling test tomorrow, couldn't sleep well",
        "Bé nói không muốn đi học vì sợ bị kêu lên bảng",
        "Bé ít nói hơn bình thường, hỏi thì bảo 'không sao' nhưng có vẻ buồn",
        "Stressed about group project, felt her part wasn't good enough",
        "Bé hỏi nếu bị điểm kém thì có sao không, lo lắng về kiểm tra",
        "Cried before bed, said she doesn't understand science and feels stupid",
    ],
    "Disengaged": [
        "Bé không muốn làm bài tập, bảo chán học",
        "Just wanted to watch TV all afternoon, had to remind multiple times",
        "Bé cáu kỉnh, không muốn đọc sách, nói mệt",
        "Very disinterested today, said school is boring",
        "Bé ngồi thẫn thờ cả buổi chiều, không chịu làm gì",
        "Refused to practice multiplication, said it's pointless",
        "Bé mệt và không tập trung, có lẽ cần ngủ nghỉ nhiều hơn",
    ],
}

# Weekend-specific notes (no school subjects)
WEEKEND_NOTES_BY_EMOTION = {
    "Excited": [
        "Đi sở thú, bé hỏi tên từng con vật và đặc điểm của chúng",
        "Went to the beach, she collected shells and asked about the ocean ecosystem",
        "Bé xây mô hình LEGO tòa nhà cao tầng, tự thiết kế không theo hướng dẫn",
        "Family bike ride — she led the way and didn't want to stop",
        "Bé xem phim tài liệu về khủng long, hỏi không nghỉ cả tiếng",
    ],
    "Happy": [
        "Ngày cuối tuần vui vẻ, cả nhà đi công viên cùng nhau",
        "Baked cookies together, she measured all the ingredients carefully",
        "Bé chơi với bạn hàng xóm cả buổi sáng, về nhà vui lắm",
        "Watched a movie together as a family, she laughed a lot",
        "Bé vẽ tranh tặng bà nội, tự tô màu rất cẩn thận",
    ],
    "Curious": [
        "Bé hỏi tại sao lá cây đổi màu vào mùa thu",
        "She noticed a spider web and spent 30 minutes observing and drawing it",
        "Bé tự đọc sách về hệ mặt trời và muốn xem bầu trời đêm",
        "Asked dozens of questions about how cars work while we drove",
        "Tự làm thí nghiệm với nước và muối, hỏi tại sao muối tan",
    ],
    "Neutral": [
        "Cuối tuần bình thường ở nhà",
        "Played indoors, nothing special",
        "Bé nghỉ ngơi ở nhà, xem TV và chơi với đồ chơi",
        "Quiet weekend, relaxed and recharged",
        "Stayed home, did some drawing and reading",
    ],
    "Anxious": [
        "Bé lo lắng về tuần học mới sắp tới",
        "Worried about the upcoming test, asked to practice more",
        "Bé có vẻ căng thẳng, khó ngủ tối thứ 7",
        "Nervous about presenting in class on Monday",
        "Bé hỏi nhiều về bài kiểm tra, không thư giãn được",
    ],
    "Disengaged": [
        "Bé chơi game quá nhiều, không muốn làm gì khác",
        "Spent most of the day watching videos, seemed withdrawn",
        "Bé ít nói, ngại tham gia hoạt động gia đình",
        "Lethargic all day, skipped the family walk",
        "Just wanted to be alone, not interested in activities",
    ],
}

TEACHER_NOTES_BY_SUBJECT = {
    "Maths": [
        "Good effort on today's fractions worksheet",
        "Struggled with division but kept trying — showed persistence",
        "Excellent mental arithmetic today, answered quickly and correctly",
        "Needed extra support with word problems — will monitor",
        "Participated well in group problem-solving activity",
        "Applied prior knowledge independently — great confidence",
        "Had difficulty focusing during the lesson today",
    ],
    "English": [
        "Wonderful creative writing piece — vivid vocabulary",
        "Reading fluency is improving steadily week by week",
        "Contributed great ideas during class discussion",
        "Needs to work on sentence punctuation — common errors",
        "Excellent comprehension of the story passage today",
        "Was quiet during the lesson — may need encouragement",
        "Strong vocabulary, used new words correctly in context",
    ],
    "Science": [
        "Showed genuine curiosity during the plant experiment",
        "Asked insightful questions about the water cycle",
        "Made accurate observations during the lab activity",
        "Still working on understanding cause and effect relationships",
        "Great teamwork during the group investigation",
        "Drew detailed diagrams — excellent visual representation",
        "Remembered prior knowledge and connected it to today's lesson",
    ],
    "PE": [
        "Outstanding effort in the relay race today — great team spirit",
        "Demonstrated excellent coordination in the gymnastics session",
        "Showed leadership during the team game",
        "Participated enthusiastically — encouraged peers well",
        "Still developing confidence in swimming — progressing",
        "Very active and energetic throughout the lesson",
        "Followed instructions well and demonstrated good sportsmanship",
    ],
    "Creative Arts": [
        "Produced a beautifully detailed drawing with excellent colour use",
        "Showed strong imagination in the clay modelling task",
        "Used experimental techniques and explained her choices",
        "Needs guidance to stay on task during open-ended activities",
        "Created a very expressive artwork — showed deep engagement",
        "Supported classmates and shared materials generously",
        "Demonstrated improving fine motor skills in craft work",
    ],
    "HSIE": [
        "Made thoughtful connections between local and global communities",
        "Contributed well to the class discussion about community helpers",
        "Showed empathy when discussing different cultural perspectives",
        "Research skills are developing — used multiple sources",
        "Participated well in the role-play activity about government",
        "Needs to build confidence sharing ideas with the group",
        "Asked great questions about how laws protect communities",
    ],
}

# ─── Generator ────────────────────────────────────────────────────────────────

def pick_bloom(phase: dict, previous: float | None = None) -> int:
    """Sample Bloom level, with slight auto-correlation to previous."""
    base = phase["bloom_mean"]
    if previous is not None:
        base = 0.3 * base + 0.7 * previous  # momentum
    raw = random.gauss(base, phase["bloom_std"])
    return max(1, min(5, round(raw)))


def pick_emotion(phase: dict, bloom: int | None = None) -> str:
    """Sample emotion, biased by bloom level."""
    weights = list(phase["emotion_weights"])
    if bloom is not None:
        if bloom >= 4:
            weights[0] = weights[0] * 2  # more Excited
            weights[4] = weights[4] * 0.3  # less Anxious
        elif bloom <= 2:
            weights[4] = weights[4] * 2  # more Anxious
            weights[5] = weights[5] * 1.5  # more Disengaged
    total = sum(weights)
    weights = [w / total for w in weights]
    return random.choices(EMOTIONS, weights=weights)[0]


def generate_parent_note(emotion: str, is_school_day: bool) -> str:
    pool = (WEEKEND_NOTES_BY_EMOTION if not is_school_day else PARENT_NOTES_BY_EMOTION)
    return random.choice(pool.get(emotion, pool["Neutral"]))


def generate_teacher_note(subject: str) -> str:
    return random.choice(TEACHER_NOTES_BY_SUBJECT.get(subject, ["Good participation today"]))


def generate_entries() -> list[dict]:
    entries = []
    prev_bloom: dict[str, float | None] = {s: None for s in SUBJECTS}

    for day_idx in range(TOTAL_DAYS):
        date = START_DATE + datetime.timedelta(days=day_idx)
        date_str = date.isoformat()
        weekday = date.weekday()  # 0=Mon … 6=Sun
        is_school_day = weekday < 5  # Mon–Fri
        phase = get_phase(day_idx)

        # Overall day emotion
        day_bloom = None
        if is_school_day:
            # Pick 1–3 subjects for today
            n_subjects = random.choices([1, 2, 3], weights=[0.2, 0.5, 0.3])[0]
            subj_pool = random.choices(
                list(SUBJECT_WEIGHTS.keys()),
                weights=list(SUBJECT_WEIGHTS.values()),
                k=n_subjects,
            )
            subj_pool = list(dict.fromkeys(subj_pool))  # deduplicate preserving order
            day_bloom = None
            for subj in subj_pool:
                bloom = pick_bloom(phase, prev_bloom[subj])
                prev_bloom[subj] = bloom
                if day_bloom is None:
                    day_bloom = bloom
                emotion_subj = pick_emotion(phase, bloom)
                teacher_note = generate_teacher_note(subj)
                teacher_scores = score_note_fast(teacher_note, "teacher")
                entries.append({
                    "date": date_str,
                    "is_school_day": True,
                    "subject": subj,
                    "cognitiveLevel": bloom,
                    "emotion": emotion_subj,
                    "parent_note": None,        # filled at end-of-day
                    "parent_note_scores": None,  # filled at end-of-day
                    "teacher_note": teacher_note,
                    "teacher_note_scores": teacher_scores,
                })

        # End-of-day parent entry (appears for every day, school or weekend)
        day_emotion = pick_emotion(phase, day_bloom)
        parent_note = generate_parent_note(day_emotion, is_school_day)
        parent_scores = score_note_fast(parent_note, "parent")

        if is_school_day and entries:
            # Fill parent note into the last subject entry of the day
            for e in reversed(entries):
                if e["date"] == date_str and e["parent_note"] is None:
                    e["parent_note"] = parent_note
                    e["parent_note_scores"] = parent_scores
                    e["emotion"] = day_emotion  # override with consistent day emotion
                    break
            # Also add all-day parent entry (for weekend-style tools that scan by date)
            entries.append({
                "date": date_str,
                "is_school_day": True,
                "subject": None,              # parent-only entry
                "cognitiveLevel": None,
                "emotion": day_emotion,
                "parent_note": parent_note,
                "parent_note_scores": parent_scores,
                "teacher_note": None,
                "teacher_note_scores": None,
            })
        else:
            # Weekend: one entry per day
            entries.append({
                "date": date_str,
                "is_school_day": False,
                "subject": None,
                "cognitiveLevel": None,
                "emotion": day_emotion,
                "parent_note": parent_note,
                "parent_note_scores": parent_scores,
                "teacher_note": None,
                "teacher_note_scores": None,
            })

    return entries


# ─── Statistics summary ───────────────────────────────────────────────────────

def print_stats(entries: list[dict]) -> None:
    from collections import Counter
    print(f"\nTotal entries : {len(entries)}")
    school = [e for e in entries if e["is_school_day"] and e["subject"]]
    weekend = [e for e in entries if not e["is_school_day"]]
    print(f"School entries (with subject): {len(school)}")
    print(f"Weekend entries : {len(weekend)}")
    subj_count = Counter(e["subject"] for e in school)
    print(f"Subject distribution: {dict(subj_count)}")
    em_count = Counter(e["emotion"] for e in entries)
    print(f"Emotion distribution: {dict(em_count)}")
    bloom_vals = [e["cognitiveLevel"] for e in school]
    print(f"Bloom avg: {sum(bloom_vals)/len(bloom_vals):.2f}  min:{min(bloom_vals)}  max:{max(bloom_vals)}")
    with_parent = sum(1 for e in entries if e["parent_note"])
    print(f"Entries with parent_note: {with_parent}")
    with_teacher = sum(1 for e in entries if e["teacher_note"])
    print(f"Entries with teacher_note: {with_teacher}")


if __name__ == "__main__":
    print("Generating 400-day mock dataset...")
    entries = generate_entries()

    out_path = os.path.join(os.path.dirname(__file__), "mock_data_400days.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"Saved to {out_path}")
    print_stats(entries)
