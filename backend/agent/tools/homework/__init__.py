"""
Homework Assistant Tools
========================
Context tools for the Learning Companion chatbot.
Each tool covers one topic area and pulls data from the insights system.
"""
from __future__ import annotations
import json
import os
from functools import lru_cache
from langchain_core.tools import tool

# ── Lazy-load computed insights from mock data ────────────────────────────────

@lru_cache(maxsize=1)
def _load_insights() -> dict:
    """Load and cache insights computed from 400-day mock data."""
    try:
        mock_path = os.path.normpath(os.path.join(
            os.path.dirname(__file__),
            "..", "..", "..", "tests", "data", "mock_data_400days.json"
        ))
        with open(mock_path, encoding="utf-8") as f:
            entries = json.load(f)

        from routers.insights import _run_tools_on_entries
        result = _run_tools_on_entries(
            entries=entries,
            child_age=9,
            curriculum_benchmark=3.0,
            app_usage_streak=14,
            ref_date="2026-04-06",
        )
        return result
    except Exception as e:
        return {"_error": str(e)}


# ── Homework context (weekly assignments) ─────────────────────────────────────

SAMPLE_HOMEWORK_CONTEXT = {
    "week": "Week 15",
    "year_level": "Year 4",
    "class": "4B — Mrs Johnson",
    "assignments": [
        {
            "subject": "Maths",
            "topic": "Multiplication & Division",
            "description": (
                "Practice multiplying 2-digit numbers by 1-digit numbers using "
                "the area model strategy. Complete pages 45–46 in the blue workbook. "
                "Focus on: 23×4, 37×6, 48×5, 19×8, 56×3."
            ),
            "concepts": [
                "Area model: split the 2-digit number into tens and ones, multiply each part separately, then add",
                "Example: 23×4 = (20×4) + (3×4) = 80 + 12 = 92",
                "Check answers using inverse: 92 ÷ 4 should give back 23",
            ],
            "due": "Friday",
            "difficulty": "Medium",
        },
        {
            "subject": "English",
            "topic": "Persuasive Writing",
            "description": (
                "Write a 3-paragraph persuasive text (minimum 150 words) on: "
                "'Should schools have longer lunch breaks?' "
                "Must include: an opening statement, 2 reasons with evidence, a conclusion."
            ),
            "concepts": [
                "Persuasive text structure: PEEL (Point, Evidence, Explanation, Link)",
                "Persuasive language: 'It is clear that...', 'Research shows...', 'Therefore...'",
                "Strong openings: state your position clearly from the first sentence",
            ],
            "due": "Thursday",
            "difficulty": "Medium-High",
        },
        {
            "subject": "Science",
            "topic": "States of Matter",
            "description": (
                "Draw and label a diagram showing how water changes between solid, liquid, "
                "and gas states. Include arrows showing: melting, freezing, evaporation, condensation. "
                "Write one sentence explaining each process."
            ),
            "concepts": [
                "Solid → Liquid: melting (heat added), e.g. ice → water",
                "Liquid → Gas: evaporation/boiling (heat added), e.g. water → steam",
                "Gas → Liquid: condensation (heat removed), e.g. steam → water droplets",
                "Liquid → Solid: freezing (heat removed), e.g. water → ice",
            ],
            "due": "Wednesday",
            "difficulty": "Easy-Medium",
        },
        {
            "subject": "HSIE",
            "topic": "Australian Communities",
            "description": (
                "Research one Australian community and create a fact file with: "
                "location, population, main industries, and one interesting fact."
            ),
            "concepts": [
                "Communities share services, geography, and culture",
                "Primary industries: farming, mining; Secondary: manufacturing; Tertiary: services",
            ],
            "due": "Monday (next week)",
            "difficulty": "Easy",
        },
    ],
}


def get_homework_context_text() -> str:
    """Return formatted homework context for agent system prompt."""
    ctx = SAMPLE_HOMEWORK_CONTEXT
    lines = [
        f"CURRENT HOMEWORK — {ctx['week']}, {ctx['year_level']}, {ctx['class']}",
        "=" * 55,
    ]
    for a in ctx["assignments"]:
        lines.append(f"\n📚 {a['subject'].upper()} — {a['topic']} (Due: {a['due']})")
        lines.append(f"Task: {a['description']}")
        lines.append("Key concepts:")
        for c in a["concepts"]:
            lines.append(f"  • {c}")
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 1 — Homework & Study Help
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def get_current_homework(subject: str = "") -> str:
    """
    Get this week's homework assignments and key concepts taught in class.

    Args:
        subject: Optional filter e.g. 'Maths', 'English'. Empty = all subjects.
    Returns:
        Homework tasks, concepts, due dates, and difficulty level.
    """
    ctx = SAMPLE_HOMEWORK_CONTEXT
    assignments = (
        [a for a in ctx["assignments"] if subject.lower() in a["subject"].lower()]
        if subject else ctx["assignments"]
    )
    if not assignments:
        return f"No homework found for '{subject}' this week."

    lines = [f"Homework — {ctx['week']}, {ctx['year_level']}:"]
    for a in assignments:
        lines.append(f"\n{a['subject']} — {a['topic']} (Due: {a['due']}, Difficulty: {a['difficulty']})")
        lines.append(f"Task: {a['description']}")
        for c in a["concepts"]:
            lines.append(f"  • {c}")
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 2 — Emotional Wellbeing & Mental Health
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def get_wellbeing_summary() -> str:
    """
    Get the child's emotional wellbeing profile from recent journal data.
    Includes: PERMA scores, positivity ratio, emotional trend, and any alerts.
    Use when parent asks about child's mood, happiness, stress, or anxiety.
    """
    data = _load_insights()
    if "_error" in data:
        return "Wellbeing data unavailable. Using general guidance."

    e = data.get("emotion", {})
    perma = e.get("perma_scores", {})
    ratio = e.get("positivity_ratio", 0)
    status = e.get("ratio_status", "Unknown")
    today = e.get("today", {})
    alert = e.get("alert")
    trend_week = e.get("chart_data_week", [])

    lines = [
        "=== CHILD WELLBEING PROFILE ===",
        f"Overall status: {status} (positivity ratio: {round(ratio * 100)}%)",
        f"Latest emotion: {today.get('emotion', 'N/A')} — {today.get('message', '')}",
        "",
        "PERMA Scores (0-100):",
    ]
    for k, v in perma.items():
        bar = "█" * (v // 10) + "░" * (10 - v // 10)
        lines.append(f"  {k:15s} {bar} {v}")

    if trend_week:
        lines.append("\nRecent 7-day emotional trend:")
        for pt in trend_week[-5:]:
            lines.append(f"  {pt.get('day','')}: {pt.get('emoji','')} {pt.get('emotion','')} (score {pt.get('score','')})")

    if alert:
        lines.append(f"\n⚠️ ALERT ({alert['type']}): {alert['message']}")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 3 — Learning Style & Multiple Intelligences
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def get_learning_profile() -> str:
    """
    Get the child's learning style (VARK) and multiple intelligences profile.
    Use when parent asks how their child learns best, or what teaching approach to use at home.
    """
    data = _load_insights()
    if "_error" in data:
        return "Learning profile unavailable. Using general guidance."

    vark = data.get("vark", {})
    intel = data.get("intelligences", {})

    dist = vark.get("vark_distribution", {})
    primary = vark.get("primary_hint", "Visual")
    suggestion = vark.get("multimodal_suggestion", "")

    radar = intel.get("radar_data", {})
    top = intel.get("top_strengths", [])
    insight_msg = intel.get("insight_message", "")

    lines = [
        "=== CHILD LEARNING PROFILE ===",
        "",
        f"PRIMARY LEARNING STYLE: {primary} Learner",
        "VARK Distribution:",
    ]
    for style, pct in sorted(dist.items(), key=lambda x: -x[1]):
        bar = "█" * (pct // 10) + "░" * (10 - pct // 10)
        lines.append(f"  {style:12s} {bar} {pct}%")

    lines.append(f"\nSuggestion: {suggestion}")
    lines.append(f"\nTOP INTELLIGENCES: {', '.join(top)}")
    lines.append("Intelligence Radar (0-100):")
    for name, score in sorted(radar.items(), key=lambda x: -x[1]):
        bar = "█" * (score // 10) + "░" * (10 - score // 10)
        lines.append(f"  {name:15s} {bar} {score}")
    lines.append(f"\n💡 {insight_msg}")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 4 — Cognitive Development & Academic Growth
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def get_cognitive_development() -> str:
    """
    Get the child's cognitive growth trajectory, Bloom's taxonomy level, and subject performance.
    Use when parent asks about academic progress, grade-level expectations, or subject strengths.
    """
    data = _load_insights()
    if "_error" in data:
        return "Cognitive data unavailable. Using general guidance."

    cog = data.get("cognition", {})
    meta = data.get("meta", {})

    avg_bloom = cog.get("average_bloom_level", 3.0)
    adj_bloom = cog.get("adjusted_bloom_level", avg_bloom)
    status = cog.get("status_badge", "On Track")
    insight = cog.get("development_insight", "")
    support = cog.get("recommended_support", "")
    trend = cog.get("weekly_trend", [])
    subj_avgs = meta.get("subject_avgs", {})

    bloom_labels = {1: "Remember", 2: "Understand", 3: "Apply", 4: "Analyse", 5: "Evaluate"}
    bloom_level = round(adj_bloom)
    bloom_label = bloom_labels.get(bloom_level, "Apply")

    lines = [
        "=== COGNITIVE DEVELOPMENT PROFILE ===",
        f"Status: {status}",
        f"Average Bloom's Level: {adj_bloom}/5 → {bloom_label}",
        f"\nInsight: {insight}",
        f"Recommended support: {support}",
        "",
        "Bloom's Level Trend (monthly averages):",
    ]
    for pt in trend[-6:]:
        level = pt.get("level", 3)
        bar = "█" * int(level * 2)
        lines.append(f"  {pt.get('week',''):8s}  {bar} {level}")

    if subj_avgs:
        lines.append("\nSubject Averages (Bloom 1-5):")
        for subj, avg in sorted(subj_avgs.items(), key=lambda x: -x[1]):
            bar = "█" * int(avg * 2) + "░" * (10 - int(avg * 2))
            lines.append(f"  {subj:15s} {bar} {avg}")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 5 — Personality Profile (OCEAN)
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def get_personality_profile() -> str:
    """
    Get the child's personality traits (Big Five OCEAN) and career aptitude signals.
    Use when parent asks about personality, strengths, social behaviour, or future interests.
    """
    data = _load_insights()
    if "_error" in data:
        return "Personality data unavailable. Using general guidance."

    pers = data.get("personality", {})
    career = data.get("career", {})

    traits = pers.get("traits", {})
    superpower = pers.get("superpower", "Unique Learner")
    insight = pers.get("insight", "")
    reminder = pers.get("gentle_reminder", "")
    holland = career.get("holland_code", "")
    top_clusters = career.get("top_clusters", [])
    inspiration = career.get("pathway_inspiration", "")

    trait_desc = {
        "Openness":          "Curiosity, creativity, openness to new ideas",
        "Conscientiousness": "Organisation, persistence, responsibility",
        "Extraversion":      "Social energy, enthusiasm, assertiveness",
        "Agreeableness":     "Empathy, cooperation, warmth",
        "Neuroticism":       "Emotional sensitivity, reactivity to stress",
    }

    lines = [
        "=== PERSONALITY PROFILE (OCEAN) ===",
        f"Superpower: {superpower}",
        f"Insight: {insight}",
        "",
        "Big Five Traits (0-100):",
    ]
    for trait, score in traits.items():
        bar = "█" * (score // 10) + "░" * (10 - score // 10)
        desc = trait_desc.get(trait, "")
        lines.append(f"  {trait:18s} {bar} {score}  ({desc})")

    if reminder:
        lines.append(f"\n💡 Gentle reminder: {reminder}")

    lines.append(f"\nCareer Aptitude Signals:")
    lines.append(f"  Holland Code: {holland}")
    lines.append(f"  Top interest clusters: {', '.join(top_clusters)}")
    lines.append(f"  {inspiration}")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 6 — Schedule & Routine Advice
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def get_schedule_context() -> str:
    """
    Get homework due dates this week and evidence-based schedule recommendations.
    Use when parent asks about homework routine, study timetable, or time management.
    """
    ctx = SAMPLE_HOMEWORK_CONTEXT
    data = _load_insights()
    cog = data.get("cognition", {}) if "_error" not in data else {}
    status = cog.get("status_badge", "On Track")

    due_list = sorted(ctx["assignments"], key=lambda a: a["due"])

    routine_tips = {
        "Building Foundations": [
            "Keep sessions short: 10-15 mins per subject with breaks",
            "Do homework immediately after school while energy is higher",
            "Use a visual timer so the child can see progress",
        ],
        "On Track": [
            "20-25 min focused sessions with 5-min breaks (Pomodoro)",
            "Same time each day builds habit — right after a snack works well",
            "Hardest subject first when concentration is highest",
        ],
        "Exploring Ahead": [
            "Can handle 25-30 min sessions; allow self-directed study",
            "Encourage planning their own schedule for the week",
            "Add extension activities: library books, documentaries, experiments",
        ],
    }
    tips = routine_tips.get(status, routine_tips["On Track"])

    lines = [
        f"=== SCHEDULE CONTEXT ({ctx['week']}) ===",
        "",
        "Homework due this week (by priority):",
    ]
    for a in due_list:
        lines.append(f"  {a['due']:20s} {a['subject']} — {a['topic']} ({a['difficulty']})")

    lines.append(f"\nRecommended routine for '{status}' learner:")
    for tip in tips:
        lines.append(f"  ✅ {tip}")

    lines.append("\nGeneral tips:")
    lines.append("  • Consistent location removes decision fatigue")
    lines.append("  • No screens during homework (unless needed)")
    lines.append("  • End with something enjoyable as positive reinforcement")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 7 — Health & Nutrition for Learning
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def get_health_tips(topic: str = "") -> str:
    """
    Get evidence-based health, nutrition, and sleep tips to support learning.
    Use when parent asks about food, sleep, exercise, or energy levels.

    Args:
        topic: 'sleep', 'nutrition', 'exercise', or empty for all.
    """
    tips = {
        "sleep": {
            "title": "Sleep for Year 4 (Age 9–10)",
            "recommendation": "9–11 hours per night",
            "tips": [
                "Consistent bedtime (e.g. 8:00 PM) — even on weekends",
                "Screen-free 1 hour before bed (blue light delays melatonin)",
                "Memory consolidation happens during deep sleep — cramming the night before doesn't work",
                "Signs of poor sleep: irritability, poor concentration, forgetting things",
                "A consistent morning routine helps regulate the body clock",
            ],
        },
        "nutrition": {
            "title": "Brain-Boosting Nutrition",
            "recommendation": "Balanced meals with protein, complex carbs, healthy fats",
            "tips": [
                "Breakfast matters: oats/eggs/yoghurt sustain concentration until lunch",
                "Omega-3 (salmon, walnuts, flaxseed) supports memory and focus",
                "Iron-rich foods (lean meat, spinach, lentils) prevent fatigue",
                "Avoid high-sugar snacks before homework — causes energy crash in 30 min",
                "Water: dehydration causes 10% drop in cognitive performance",
                "Good homework snack: apple + peanut butter, cheese + crackers, handful of nuts",
            ],
        },
        "exercise": {
            "title": "Physical Activity & Learning",
            "recommendation": "60 minutes of moderate activity daily",
            "tips": [
                "Exercise increases BDNF (brain fertiliser) — improves memory and attention",
                "Even a 10-min walk before homework can boost focus by 20%",
                "Sports and active play develop executive function and self-regulation",
                "Reduce sitting time: homework break every 25 min with 5 min movement",
                "Outdoor play is especially beneficial — natural light regulates mood",
            ],
        },
    }

    if topic and topic.lower() in tips:
        section = tips[topic.lower()]
        lines = [f"=== {section['title'].upper()} ===",
                 f"Recommendation: {section['recommendation']}", ""]
        for t in section["tips"]:
            lines.append(f"  • {t}")
        return "\n".join(lines)

    lines = ["=== HEALTH & LEARNING TIPS ===", ""]
    for key, section in tips.items():
        lines.append(f"📌 {section['title']} ({section['recommendation']})")
        for t in section["tips"][:3]:
            lines.append(f"   • {t}")
        lines.append("")
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

def get_tools():
    return [
        get_current_homework,
        get_wellbeing_summary,
        get_learning_profile,
        get_cognitive_development,
        get_personality_profile,
        get_schedule_context,
        get_health_tips,
    ]
