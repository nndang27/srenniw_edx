"""
INSIGHTS TOOLS — Child Development Dashboard
═════════════════════════════════════════════
6 analytical tools that compute structured insight data from journal entries.

Each entry may include:
  - date (str YYYY-MM-DD)        required
  - is_school_day (bool)         optional, inferred from weekday if absent
  - subject (str | None)         None for weekend / parent-only entries
  - cognitiveLevel (int 1–5 | None)
  - emotion (str)
  - parent_note (str | None)
  - parent_note_scores (dict | None)  pre-scored numeric dimensions
  - teacher_note (str | None)
  - teacher_note_scores (dict | None)
  - notes (str | None)           legacy field (alias for parent_note)

All subject-based tools skip entries where subject is None.
Emotion tool uses every entry (school + weekend).

Time-decay weighting:
  Intelligence, RIASEC, Personality : half-life 120 days
  VARK                               : half-life  90 days
  Cognition                          : half-life  60 days
  Emotion                            : no decay  (raw time-series)
"""
import json
from langchain_core.tools import tool
from agent.tools.insights.decay import (
    decay_weight,
    HALF_LIFE_INTELLIGENCE,
    HALF_LIFE_VARK,
    HALF_LIFE_COGNITION,
    HALF_LIFE_PERSONALITY,
)
from agent.tools.insights.note_scorer import score_note_fast

# ─── Note dimension helpers ───────────────────────────────────────────────────

def _get_parent_scores(entry: dict) -> dict:
    """Return pre-scored parent note dimensions, computing them if absent."""
    if entry.get("parent_note_scores"):
        return entry["parent_note_scores"]
    note = entry.get("parent_note") or entry.get("notes", "")
    return score_note_fast(note, "parent")


def _get_teacher_scores(entry: dict) -> dict:
    """Return pre-scored teacher note dimensions, computing them if absent."""
    if entry.get("teacher_note_scores"):
        return entry["teacher_note_scores"]
    note = entry.get("teacher_note", "")
    return score_note_fast(note or "", "teacher")


def _is_school_entry(entry: dict) -> bool:
    """True if entry has a subject (school day subject record)."""
    return bool(entry.get("subject"))


# ─── Emotion score mapping ────────────────────────────────────────────────────

_POSITIVE_EMOTIONS = {"Excited", "Happy", "Curious"}
_EMOTION_SCORE = {
    "Excited": 5, "Happy": 5, "Curious": 4,
    "Neutral": 3, "Anxious": 2, "Disengaged": 1,
}
_SCORE_EMOJI = {5: "🤩", 4: "🤔", 3: "😐", 2: "😰", 1: "🥱"}


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 1 — Multiple Intelligences (Gardner's 8)
# ═══════════════════════════════════════════════════════════════════════════════

_SUBJECT_TO_INTEL: dict[str, dict[str, float]] = {
    "Maths":         {"Logical": 1.0},
    "Science":       {"Naturalist": 0.6, "Logical": 0.4},
    "English":       {"Linguistic": 1.0},
    "HSIE":          {"Interpersonal": 0.7, "Linguistic": 0.3},
    "Creative Arts": {"Spatial": 0.6, "Musical": 0.4},
    "PE":            {"Kinesthetic": 1.0},
    "Music":         {"Musical": 0.8, "Interpersonal": 0.2},
    "Drama":         {"Kinesthetic": 0.5, "Interpersonal": 0.5},
}

_INTEL_KEYS = [
    "Logical", "Linguistic", "Spatial", "Kinesthetic",
    "Musical", "Interpersonal", "Intrapersonal", "Naturalist",
]


@tool
def calculate_multiple_intelligences(entries_json: str, ref_date: str = "") -> str:
    """Compute Gardner's 8 Multiple Intelligences profile from journal entries.

    Uses exponential time-decay (half-life 120 days) so recent learning patterns
    dominate over old ones.

    Args:
        entries_json: JSON array of journal entries.
        ref_date: Reference date for decay calculation (YYYY-MM-DD). Defaults to today.

    Returns:
        JSON with radar_data (8 scores 0-100), top_strengths, insight_message.
    """
    try:
        entries = json.loads(entries_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON input"})

    acc: dict[str, dict] = {k: {"total": 0.0, "count": 0.0} for k in _INTEL_KEYS}
    ref = ref_date or None

    for e in entries:
        if not _is_school_entry(e):
            continue
        subject  = e.get("subject", "")
        level    = e.get("cognitiveLevel") or 3
        emotion  = e.get("emotion", "")
        w        = decay_weight(e.get("date", ""), ref, HALF_LIFE_INTELLIGENCE)
        pscores  = _get_parent_scores(e)
        tscores  = _get_teacher_scores(e)

        # Subject → intelligence weights
        weights = _SUBJECT_TO_INTEL.get(subject, {})
        for intel, iw in weights.items():
            acc[intel]["total"] += level * iw * w
            acc[intel]["count"] += iw * w

        # Boost Curiosity → Intrapersonal + Naturalist
        curiosity_boost = pscores.get("curiosity_index", 0) * 0.5 + (
            0.3 if emotion == "Curious" else 0
        )
        if curiosity_boost > 0:
            acc["Intrapersonal"]["total"] += curiosity_boost * w
            acc["Intrapersonal"]["count"] += 0.3 * w

        # Social engagement → Interpersonal
        social = pscores.get("social_engagement", 0)
        if social > 0.3:
            acc["Interpersonal"]["total"] += social * level * w
            acc["Interpersonal"]["count"] += social * w

        # Activity level → Kinesthetic
        activity = pscores.get("activity_level", 0)
        if activity > 0.3:
            acc["Kinesthetic"]["total"] += activity * level * w
            acc["Kinesthetic"]["count"] += activity * w

        # Teacher engagement observed → boosts current subject intel
        eng = tscores.get("engagement_observed", 0)
        if eng > 0.5:
            for intel, iw in weights.items():
                acc[intel]["total"] += eng * iw * w * 0.3
                acc[intel]["count"] += iw * w * 0.3

    radar: dict[str, int] = {}
    for k in _INTEL_KEYS:
        if acc[k]["count"] > 0:
            raw = acc[k]["total"] / acc[k]["count"]  # ~0–5
            radar[k] = min(100, max(20, round(20 + (raw / 5) * 80)))
        else:
            radar[k] = 40

    top = sorted(_INTEL_KEYS, key=lambda k: radar[k], reverse=True)[:2]
    
    return json.dumps({
        "radar_data": radar,
        "top_strengths": top,
        "insight_message": (
            f"Your child shows strong potential in {top[0]} and {top[1]}. "
            "These are great areas to nurture with fun activities!"
        ),
    }, ensure_ascii=False)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 2 — VARK Learning Styles
# ═══════════════════════════════════════════════════════════════════════════════

_SUBJECT_TO_VARK: dict[str, dict[str, float]] = {
    "Maths":         {"Reading": 0.5, "Visual": 0.5},
    "Science":       {"Visual": 0.5, "Kinesthetic": 0.3, "Reading": 0.2},
    "English":       {"Reading": 0.8, "Auditory": 0.2},
    "HSIE":          {"Reading": 0.5, "Auditory": 0.3, "Visual": 0.2},
    "Creative Arts": {"Visual": 0.6, "Kinesthetic": 0.4},
    "PE":            {"Kinesthetic": 0.8, "Auditory": 0.2},
    "Music":         {"Auditory": 0.8, "Kinesthetic": 0.2},
    "Drama":         {"Kinesthetic": 0.5, "Auditory": 0.5},
}


@tool
def analyze_vark_style(entries_json: str, ref_date: str = "") -> str:
    """Compute VARK learning style distribution from journal entries.

    Uses time-decay (half-life 90 days) and parent_note_scores dimensions.

    Args:
        entries_json: JSON array with journal entries.
        ref_date: Reference date for decay (YYYY-MM-DD). Defaults to today.

    Returns:
        JSON with vark_distribution (%), primary_hint, multimodal_suggestion.
    """
    try:
        entries = json.loads(entries_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON"})

    acc: dict[str, float] = {"Visual": 0.0, "Auditory": 0.0, "Reading": 0.0, "Kinesthetic": 0.0}
    ref = ref_date or None

    for e in entries:
        if not _is_school_entry(e):
            continue
        subject = e.get("subject", "")
        level   = e.get("cognitiveLevel") or 3
        emotion = e.get("emotion", "")
        w       = decay_weight(e.get("date", ""), ref, HALF_LIFE_VARK)
        pscores = _get_parent_scores(e)

        # Note dimension → VARK style mapping
        acc["Visual"]      += pscores.get("curiosity_index", 0) * 1.5 * w
        acc["Kinesthetic"] += pscores.get("activity_level",  0) * 2.0 * w
        acc["Auditory"]    += pscores.get("parent_child_connection", 0) * 1.0 * w
        acc["Reading"]     += pscores.get("focus_depth", 0) * 1.5 * w

        # Subject context bonus (if positive engagement)
        is_positive = emotion in ("Excited", "Happy") or level >= 4
        if is_positive:
            bonus_map = {
                "Science": {"Kinesthetic": 3, "Visual": 1},
                "PE":      {"Kinesthetic": 3, "Visual": 1},
                "Drama":   {"Kinesthetic": 3, "Auditory": 1},
                "Maths":   {"Visual": 3, "Kinesthetic": 1},
                "Creative Arts": {"Visual": 3, "Kinesthetic": 1},
                "English": {"Reading": 3, "Auditory": 1},
                "HSIE":    {"Reading": 3, "Auditory": 1},
                "Music":   {"Auditory": 3, "Kinesthetic": 1},
            }
            for style, pts in bonus_map.get(subject, {}).items():
                acc[style] += pts * w

        # Teacher engagement signal
        tscores = _get_teacher_scores(e)
        if tscores.get("engagement_observed", 0) > 0.6:
            base_style = _SUBJECT_TO_VARK.get(subject, {})
            for style, sw in base_style.items():
                acc[style] += sw * w

    total = sum(acc.values()) or 1
    dist = {k: round(v / total * 100) for k, v in acc.items()}
    diff = 100 - sum(dist.values())
    dist[max(dist, key=lambda k: dist[k])] += diff

    primary = max(dist, key=lambda k: dist[k])
    suggestions = {
        "Visual":      "Try diagrams, mind maps, colour-coding, and educational videos.",
        "Auditory":    "Read lessons aloud, use podcasts, and explain concepts verbally.",
        "Reading":     "Use flashcards, bullet-point summaries, and written notes.",
        "Kinesthetic": "Hands-on experiments, physical games, and movement-based activities.",
    }
    return json.dumps({
        "vark_distribution": dist,
        "primary_hint": primary,
        "disclaimer": "Multimodal learning is best! Use these patterns as a starting point.",
        "multimodal_suggestion": suggestions.get(primary, "Try a variety of learning approaches."),
    }, ensure_ascii=False)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 3 — Career Path (RIASEC)
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def calculate_riasec_clusters(intelligence_scores_json: str, subject_strengths_json: str) -> str:
    """Map Gardner intelligences to Holland RIASEC career clusters.

    Args:
        intelligence_scores_json: JSON object with 8 intelligence scores (0-100).
        subject_strengths_json: JSON object mapping subject → avg cognitive level (1-5).

    Returns:
        JSON with riasec_scores, holland_code, top_clusters, cluster_groups,
        pathway_inspiration, disclaimer.
    """
    try:
        intel    = json.loads(intelligence_scores_json)
        subjects = json.loads(subject_strengths_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON"})

    def s(key: str) -> float:
        return float(intel.get(key, 40))

    riasec = {
        "Realistic":     (s("Kinesthetic") + s("Naturalist")) / 2,
        "Investigative": (s("Logical") + s("Intrapersonal")) / 2,
        "Artistic":      (s("Spatial") + s("Musical") + s("Linguistic")) / 3,
        "Social":        (s("Interpersonal") + s("Linguistic")) / 2,
        "Enterprising":  (s("Interpersonal") + s("Logical")) / 2,
        "Conventional":  s("Logical") * 0.7 + 30 * 0.3,
    }

    for subject, level in subjects.items():
        level = float(level)
        if level >= 3.5:
            if subject in ("Maths", "Science"):
                riasec["Investigative"] += level * 2
            elif subject in ("Creative Arts", "Music", "Drama"):
                riasec["Artistic"] += level * 2
            elif subject == "PE":
                riasec["Realistic"] += level * 2
            elif subject in ("English", "HSIE"):
                riasec["Social"] += level

    max_val = max(riasec.values(), default=1) or 1
    riasec_norm = {k: min(100, round(v / max_val * 100)) for k, v in riasec.items()}

    sorted_clusters = sorted(riasec_norm.items(), key=lambda x: x[1], reverse=True)
    top_clusters    = [k for k, _ in sorted_clusters[:2]]
    holland_code    = "".join(k[0] for k, _ in sorted_clusters[:3])

    cluster_groups = {
        "Realistic":     ["Engineering & Construction", "Sports & Athletics", "Agriculture & Environment"],
        "Investigative": ["Science & Research", "Healthcare & Medicine", "Technology & Data"],
        "Artistic":      ["Design & Creative Arts", "Performing Arts & Music", "Media & Literature"],
        "Social":        ["Education & Training", "Counselling & Support", "Community Health"],
        "Enterprising":  ["Business & Entrepreneurship", "Law & Policy", "Marketing & Communications"],
        "Conventional":  ["Finance & Accounting", "Administration & Management", "Information Technology"],
    }

    top1, top2 = (top_clusters + ["Social", "Investigative"])[:2]
    inspiration = (
        f"With strong {top1} and {top2} tendencies, your child may thrive in fields like: "
        f"{', '.join(cluster_groups.get(top1, [])[:2])} or {', '.join(cluster_groups.get(top2, [])[:2])}."
    )

    return json.dumps({
        "riasec_scores":     riasec_norm,
        "holland_code":      holland_code,
        "top_clusters":      top_clusters,
        "cluster_groups":    {k: cluster_groups[k] for k in top_clusters},
        "pathway_inspiration": inspiration,
        "disclaimer": "Children's interests will keep growing. Use this as a fun lens, not a prediction!",
    }, ensure_ascii=False)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 4 — Cognition Growth Velocity (Milestone Pathway)
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def analyze_cognition_growth(
    entries_json: str,
    age: int = 9,
    curriculum_benchmark: float = 3.0,
    ref_date: str = "",
) -> str:
    """Analyze cognitive growth and determine milestone pathway position.

    Uses exponential decay (half-life 60 days) to weight recent Bloom levels higher.
    Weekend / parent-only entries (no subject) are excluded from Bloom averaging.

    Args:
        entries_json: JSON array of journal entries.
        age: Child's age in years.
        curriculum_benchmark: Expected avg Bloom level for year level.
        ref_date: Reference date for decay (YYYY-MM-DD). Defaults to today.

    Returns:
        JSON with status_badge, position_value (0–2), milestones, insights,
        weekly_trend, average_bloom_level (decayed).
    """
    try:
        entries = json.loads(entries_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON"})

    school = [e for e in entries if _is_school_entry(e)]
    ref = ref_date or None

    if not school:
        return json.dumps({
            "current_position": "year_start",
            "status_badge": "Building Foundations",
            "position_value": 0.8,
            "milestones": [
                {"id": 0, "label": f"Year {max(1,age-5)} Expectations"},
                {"id": 1, "label": f"Year {max(1,age-4)} (Current)"},
                {"id": 2, "label": f"Year {max(1,age-3)} Expectations"},
            ],
            "development_insight": "Not enough data yet. Keep logging daily lessons!",
            "recommended_support": "Start journalling after lessons to track growth.",
            "weekly_trend": [],
            "average_bloom_level": curriculum_benchmark,
        }, ensure_ascii=False)

    # Decayed weighted average
    total_w, total_wl = 0.0, 0.0
    for e in school:
        w = decay_weight(e.get("date", ""), ref, HALF_LIFE_COGNITION)
        level = e.get("cognitiveLevel") or 3
        total_wl += level * w
        total_w  += w
    avg_level = total_wl / total_w if total_w > 0 else curriculum_benchmark

    # Also compute teacher difficulty signal (if struggling, reduce effective level slightly)
    diff_signals = []
    for e in school:
        w = decay_weight(e.get("date", ""), ref, HALF_LIFE_COGNITION)
        ts = _get_teacher_scores(e)
        diff_signals.append(ts.get("difficulty_signal", 0) * w)
    avg_diff = sum(diff_signals) / len(diff_signals) if diff_signals else 0
    adjusted_level = avg_level - avg_diff * 0.5  # difficulty pulls effective level down

    delta = adjusted_level - curriculum_benchmark
    if delta < -0.5:
        status, pos = "Building Foundations", max(0.5, min(0.95, 1.0 + delta))
        insight = (
            "Your child is taking time to solidify their foundations before tackling "
            "more complex challenges. This careful approach builds stronger neural connections!"
        )
        support = "Celebrate effort over outcomes. Avoid rushing ahead — depth matters more than speed."
    elif delta > 0.5:
        status, pos = "Exploring Ahead", min(1.9, max(1.3, 1.0 + delta * 0.6))
        insight = (
            "Your child has mastered most current-year concepts and shows strong momentum "
            "towards next-year challenges. Their Learning Momentum is very high!"
        )
        support = "Introduce open-ended challenges and extension activities to keep them engaged."
    else:
        status, pos = "On Track", 1.0 + delta * 0.4
        insight = (
            "Your child is absorbing Year-level concepts naturally and comfortably. "
            "They're progressing at exactly the right pace!"
        )
        support = "Keep up weekend exploration activities to nurture curiosity."

    # Weekly trend (by calendar week, last 8 weeks)
    from collections import defaultdict
    wk_buckets: dict[str, list[float]] = defaultdict(list)
    for e in school:
        d = e.get("date", "")
        if len(d) >= 7:
            wk_buckets[d[:7]].append(e.get("cognitiveLevel") or 3)
    weekly_trend = [
        {"week": wk, "level": round(sum(vs) / len(vs), 1)}
        for wk, vs in sorted(wk_buckets.items())[-8:]
    ]

    year_label = f"Year {max(1, age - 4)}"
    return json.dumps({
        "current_position": status.lower().replace(" ", "_"),
        "status_badge": status,
        "position_value": round(pos, 2),
        "milestones": [
            {"id": 0, "label": f"Year {max(1,age-5)} Expectations"},
            {"id": 1, "label": f"{year_label} (Current)"},
            {"id": 2, "label": f"Year {max(1,age-3)} Expectations"},
        ],
        "development_insight": insight,
        "recommended_support": support,
        "weekly_trend": weekly_trend,
        "average_bloom_level": round(avg_level, 2),
        "adjusted_bloom_level": round(adjusted_level, 2),
    }, ensure_ascii=False)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 5 — PERMA Emotional Wellbeing
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def analyze_perma_wellbeing(entries_json: str) -> str:
    """Analyze emotional wellbeing using Seligman's PERMA model.

    Includes ALL entries (school + weekend). No time-decay applied —
    emotion is always a raw time-series for chart display.

    Args:
        entries_json: JSON array of all journal entries (school + weekend).

    Returns:
        JSON with today, ratio_status, chart_data_week/month/year,
        alert, perma_scores.
    """
    try:
        entries = json.loads(entries_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON"})

    if not entries:
        return json.dumps({
            "today": {"emotion": "😐 Neutral", "message": "No data yet."},
            "ratio_status": "Starting",
            "chart_data_week": [], "chart_data_month": [], "chart_data_year": [],
            "alert": None,
            "perma_scores": {"Positive": 0, "Engagement": 0, "Relationships": 0, "Meaning": 0, "Achievement": 0},
        }, ensure_ascii=False)

    # Deduplicate: one emotion per date (latest entry wins)
    from collections import defaultdict
    by_date: dict[str, dict] = {}
    for e in entries:
        d = e.get("date", "")
        if d and (d not in by_date or e.get("emotion")):
            by_date[d] = e
    sorted_entries = sorted(by_date.values(), key=lambda e: e["date"])

    latest = sorted_entries[-1]
    today_emotion = latest.get("emotion", "Neutral")
    today_score   = _EMOTION_SCORE.get(today_emotion, 3)
    parent_note   = latest.get("parent_note") or latest.get("notes", "")

    emotion_messages = {
        "Excited":    "Your child is super excited today! This positive energy is great for learning.",
        "Happy":      "A happy and relaxed day — perfect conditions for absorbing new ideas!",
        "Curious":    "Your child is showing curiosity and openness — a wonderful growth mindset sign!",
        "Neutral":    "A balanced day. Completely normal and healthy!",
        "Anxious":    "Your child seems a little worried today. A gentle chat might help.",
        "Disengaged": "Your child seems disengaged today. Try a fun low-pressure activity together.",
    }

    positive_count = sum(1 for e in sorted_entries if e.get("emotion") in _POSITIVE_EMOTIONS)
    ratio = positive_count / len(sorted_entries)
    ratio_status = (
        "Flourishing" if ratio > 0.7 else
        "Growing"     if ratio > 0.5 else
        "Seeking Balance" if ratio > 0.3 else
        "Needs Support"
    )

    # Alert detection (last 7 calendar days)
    recent_7 = sorted_entries[-7:]
    anxious_count     = sum(1 for e in recent_7 if e.get("emotion") == "Anxious")
    dis_streak = 0
    for e in reversed(sorted_entries):
        if e.get("emotion") == "Disengaged":
            dis_streak += 1
        else:
            break

    alert = None
    if anxious_count >= 3:
        alert = {"type": "teacher_alert", "message": "Your child has shown signs of anxiety for 3+ days. Consider a chat with their teacher."}
    elif dis_streak >= 5:
        alert = {"type": "burnout_risk", "message": "Your child appears disengaged for 5+ days. Consider reducing academic pressure."}

    # Chart builders
    DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    import datetime

    def _day_point(e: dict) -> dict:
        sc = _EMOTION_SCORE.get(e.get("emotion", "Neutral"), 3)
        d = e.get("date", "")
        try:
            day_obj = datetime.date.fromisoformat(d)
            label = DAY_LABELS[day_obj.weekday() + 1 if day_obj.weekday() < 6 else 0]
        except Exception:
            label = d[-5:]
        note = e.get("parent_note") or e.get("notes", "")
        return {
            "day": label,
            "date": d,
            "score": sc,
            "emoji": _SCORE_EMOJI.get(round(sc), "😐"),
            "emotion": e.get("emotion", "Neutral"),
            "parent_note": (note[:120] if note else None),
        }

    chart_week = [_day_point(e) for e in sorted_entries[-7:]]

    # Month view: group into calendar weeks (last 5 weeks)
    wk_buckets: dict[str, list] = defaultdict(list)
    for e in sorted_entries[-35:]:
        d = e.get("date", "2000-01-01")
        try:
            day_obj = datetime.date.fromisoformat(d)
            mon = day_obj - datetime.timedelta(days=day_obj.weekday())
            wk_label = mon.strftime("W%d/%m")
        except Exception:
            wk_label = d[:7]
        wk_buckets[wk_label].append(e)
    chart_month = []
    for wk, wk_entries in sorted(wk_buckets.items()):
        avg_sc = sum(_EMOTION_SCORE.get(e.get("emotion", "Neutral"), 3) for e in wk_entries) / len(wk_entries)
        dom = max(wk_entries, key=lambda e: _EMOTION_SCORE.get(e.get("emotion", "Neutral"), 3)).get("emotion", "Neutral")
        chart_month.append({"day": wk, "score": round(avg_sc, 1), "emoji": _SCORE_EMOJI.get(round(avg_sc), "😐"), "emotion": dom})

    # Year view: group by calendar month
    mo_buckets: dict[str, list] = defaultdict(list)
    for e in sorted_entries:
        mo_buckets[e.get("date", "2000-01")[:7]].append(e)
    MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    chart_year = []
    for month_key, m_entries in sorted(mo_buckets.items()):
        avg_sc = sum(_EMOTION_SCORE.get(e.get("emotion", "Neutral"), 3) for e in m_entries) / len(m_entries)
        dom = max(m_entries, key=lambda e: _EMOTION_SCORE.get(e.get("emotion", "Neutral"), 3)).get("emotion", "Neutral")
        try:
            mn = int(month_key.split("-")[1]) - 1
            label = MONTH_LABELS[mn]
        except Exception:
            label = month_key
        chart_year.append({"day": label, "score": round(avg_sc, 1), "emoji": _SCORE_EMOJI.get(round(avg_sc), "😐"), "emotion": dom, "month": month_key})

    # PERMA scores (all-time, no decay for wellbeing baseline)
    school_entries = [e for e in sorted_entries if e.get("subject")]
    avg_level_all  = (sum(e.get("cognitiveLevel", 3) for e in school_entries) / len(school_entries)) if school_entries else 3
    social_ratio   = sum(1 for e in school_entries if e.get("subject") in ("HSIE", "PE")) / len(school_entries) if school_entries else 0
    bloom45_ratio  = sum(1 for e in school_entries if (e.get("cognitiveLevel") or 0) >= 4) / len(school_entries) if school_entries else 0
    perma = {
        "Positive":      round(ratio * 100),
        "Engagement":    round(avg_level_all / 5 * 100),
        "Relationships": round(min(social_ratio * 3, 1) * 100),
        "Meaning":       round(min(len(sorted_entries) / 30, 1) * 100),
        "Achievement":   round(bloom45_ratio * 100),
    }

    return json.dumps({
        "today": {
            "emotion": f"{_SCORE_EMOJI.get(today_score, '😐')} {today_emotion}",
            "score": today_score,
            "message": emotion_messages.get(today_emotion, "Today is going okay."),
            "parent_note": parent_note[:120] if parent_note else None,
        },
        "ratio_status": ratio_status,
        "positivity_ratio": round(ratio, 2),
        "chart_data_week":  chart_week,
        "chart_data_month": chart_month,
        "chart_data_year":  chart_year,
        "alert": alert,
        "perma_scores": perma,
    }, ensure_ascii=False)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 6 — OCEAN Personality Traits
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def calculate_ocean_traits(entries_json: str, app_usage_streak: int = 0, ref_date: str = "") -> str:
    """Compute Big Five OCEAN personality traits from journal patterns.

    Uses time-decay (half-life 120 days) and parent_note_scores for precision.
    Includes ALL entries (school + weekend) for holistic personality profiling.

    Args:
        entries_json: JSON array of all journal entries.
        app_usage_streak: Consecutive days the parent has logged entries.
        ref_date: Reference date for decay (YYYY-MM-DD). Defaults to today.

    Returns:
        JSON with traits (5 scores 0-100), superpower, insight, gentle_reminder.
    """
    try:
        entries = json.loads(entries_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON"})

    if not entries:
        return json.dumps({
            "traits": {"Openness": 50, "Conscientiousness": 50, "Extraversion": 50, "Neuroticism": 10, "Agreeableness": 50},
            "superpower": "Unique Learner",
            "insight": "Not enough data yet. Keep journalling!",
            "gentle_reminder": None,
        }, ensure_ascii=False)

    ref = ref_date or None
    school = [e for e in entries if _is_school_entry(e)]

    # ── O (Openness / Khám phá) ──
    # Driven by curiosity_index, bloom 4-5 ratio, subject diversity
    o_total, o_w = 0.0, 0.0
    for e in entries:
        w = decay_weight(e.get("date", ""), ref, HALF_LIFE_PERSONALITY)
        ps = _get_parent_scores(e)
        cur = ps.get("curiosity_index", 0)
        bloom_bonus = 0.3 if (e.get("cognitiveLevel") or 0) >= 4 else 0
        curious_bonus = 0.3 if e.get("emotion") == "Curious" else 0
        o_total += (cur * 0.5 + bloom_bonus + curious_bonus) * w
        o_w += w
    subject_div = len(set(e.get("subject") for e in school if e.get("subject"))) / 6
    openness = min(100, round((o_total / o_w * 80 + subject_div * 20) if o_w > 0 else 50))

    # ── C (Conscientiousness / Kiên trì) ──
    # Driven by bloom trend, focus_depth, app_usage_streak
    c_total, c_w = 0.0, 0.0
    for e in school:
        w = decay_weight(e.get("date", ""), ref, HALF_LIFE_PERSONALITY)
        ps = _get_parent_scores(e)
        focus = ps.get("focus_depth", 0)
        level = e.get("cognitiveLevel") or 3
        c_total += (level / 5 * 0.6 + focus * 0.4) * w
        c_w += w
    streak_bonus = min(30, app_usage_streak)  # up to +30 points for streak
    conscientiousness = min(100, max(20, round(
        (c_total / c_w * 70 + streak_bonus) if c_w > 0 else 40 + streak_bonus
    )))

    # ── E (Extraversion / Năng lượng) ──
    # Driven by activity_level, social_engagement, happy/excited ratio, PE/Drama subjects
    e_total, e_w = 0.0, 0.0
    for e in entries:
        w = decay_weight(e.get("date", ""), ref, HALF_LIFE_PERSONALITY)
        ps = _get_parent_scores(e)
        activity = ps.get("activity_level", 0)
        social   = ps.get("social_engagement", 0)
        happy    = 0.3 if e.get("emotion") in ("Happy", "Excited") else 0
        social_subj = 0.2 if e.get("subject") in ("PE", "Drama", "HSIE") else 0
        e_total += (activity * 0.35 + social * 0.35 + happy + social_subj) * w
        e_w += w
    extraversion = min(100, round((e_total / e_w * 100) if e_w > 0 else 40))

    # ── A (Agreeableness / Thấu cảm) ──
    # Driven by social_engagement, parent_child_connection, positive emotions
    a_total, a_w = 0.0, 0.0
    for e in entries:
        w = decay_weight(e.get("date", ""), ref, HALF_LIFE_PERSONALITY)
        ps = _get_parent_scores(e)
        social  = ps.get("social_engagement", 0)
        connect = ps.get("parent_child_connection", 0)
        pos     = 0.3 if e.get("emotion") in _POSITIVE_EMOTIONS else 0
        a_total += (social * 0.4 + connect * 0.3 + pos) * w
        a_w += w
    agreeableness = min(100, round((a_total / a_w * 100) if a_w > 0 else 40))

    # ── N (Neuroticism / Nhạy cảm) ──
    # Driven by anxious/disengaged emotions, teacher difficulty signals
    n_total, n_w = 0.0, 0.0
    for e in entries:
        w = decay_weight(e.get("date", ""), ref, HALF_LIFE_PERSONALITY)
        anxious = 1.0 if e.get("emotion") in ("Anxious", "Disengaged") else 0
        ts = _get_teacher_scores(e) if _is_school_entry(e) else {}
        diff = ts.get("difficulty_signal", 0) * 0.5
        n_total += (anxious * 0.7 + diff * 0.3) * w
        n_w += w
    neuroticism = min(100, round(10 + (n_total / n_w * 90) if n_w > 0 else 10))

    traits = {
        "Openness":          openness,
        "Conscientiousness": conscientiousness,
        "Extraversion":      extraversion,
        "Agreeableness":     agreeableness,
        "Neuroticism":       neuroticism,
    }

    # Superpower: top 2 positive traits
    pos_traits = {k: v for k, v in traits.items() if k != "Neuroticism"}
    top2 = sorted(pos_traits, key=lambda k: pos_traits[k], reverse=True)[:2]
    superpower_map = {
        frozenset(["Openness", "Conscientiousness"]):  "The Determined Explorer",
        frozenset(["Openness", "Extraversion"]):        "The Dynamic Adventurer",
        frozenset(["Openness", "Agreeableness"]):       "The Warm-Hearted Curious Mind",
        frozenset(["Conscientiousness", "Extraversion"]):"The Unstoppable Achiever",
        frozenset(["Conscientiousness", "Agreeableness"]):"The Trusted and Reliable Friend",
        frozenset(["Extraversion", "Agreeableness"]):   "The Social Star",
    }
    superpower = superpower_map.get(frozenset(top2), f"{top2[0]} & {top2[1]} Champion")

    insight = (
        f"Your child shows a wonderful combination of {top2[0]} and {top2[1]}, "
        "making them uniquely suited to thrive in both creative and collaborative settings."
    )

    gentle_reminder = None
    if neuroticism > 60:
        gentle_reminder = "Your child can be sensitive when facing difficult challenges — try breaking tasks into smaller steps to reduce pressure."
    elif conscientiousness < 40:
        gentle_reminder = "Building a small daily learning habit can help develop consistency and self-discipline over time."

    return json.dumps({
        "traits": traits,
        "superpower": superpower,
        "insight": insight,
        "gentle_reminder": gentle_reminder,
    }, ensure_ascii=False)


# ─── Export ──────────────────────────────────────────────────────────────────

def get_tools():
    return [
        calculate_multiple_intelligences,
        analyze_vark_style,
        calculate_riasec_clusters,
        analyze_cognition_growth,
        analyze_perma_wellbeing,
        calculate_ocean_traits,
    ]
