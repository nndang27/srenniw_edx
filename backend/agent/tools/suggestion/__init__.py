"""
SUGGESTION TOOLS — Sydney family-outing recommender.
═════════════════════════════════════════════════════
Pipeline:
  1. suggestion_get_family_background  → who is this family
  2. suggestion_get_recent_classwork   → what did the child learn
  3. suggestion_fetch_local_events     → what is on around Sydney
  4. suggestion_match_event_to_concept → rank + filter (respects religion)
  5. suggestion_save_to_brief          → persist as at_home_activities

Swap the events feed by setting EVENTS_API_URL in .env. The tool expects a
JSON list with the same shape as MOCK_SYDNEY_EVENTS below.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_FAMILY_BACKGROUND: dict[str, Any] = {
    "religion": None,            # 'catholic'|'muslim'|'buddhist'|'hindu'|'jewish'|'secular'|None
    "cultural_origin": None,     # free-text e.g. 'vietnamese', 'lebanese', 'anglo'
    "languages_spoken": ["en"],
    "suburb": "Sydney",          # used as proximity anchor
    "interests": [],             # ['sports', 'music', 'nature', 'science', ...]
    "family_size": None,
    "transport": "public",       # 'car'|'public'|'limited'
    "budget_level": "medium",    # 'low'|'medium'|'high'
    "weekend_availability": "any",
}

# Approx age by Australian year level (used to filter age-restricted events).
YEAR_LEVEL_AGE: dict[str, int] = {
    "Kindergarten": 5, "K": 5,
    "Year 1": 6, "Year 2": 7, "Year 3": 8,
    "Year 4": 9, "Year 5": 10, "Year 6": 11,
}

# Concept keyword groups → matched against event concepts/category.
CONCEPT_KEYWORDS: dict[str, list[str]] = {
    "geometry":   ["shape", "shapes", "geometry", "angle", "triangle", "polygon", "symmetry"],
    "fractions":  ["fraction", "half", "quarter", "divide", "portion"],
    "biology":    ["animal", "plant", "habitat", "ecosystem", "food chain", "adaptation", "life cycle"],
    "physics":    ["force", "gravity", "energy", "machine", "motion", "magnet", "buoyancy"],
    "matter":     ["state of matter", "solid", "liquid", "gas", "melt", "freeze", "evaporate"],
    "space":      ["space", "planet", "moon", "star", "earth", "solar system", "astronomy"],
    "history":    ["history", "convict", "first nations", "indigenous", "settler", "explorer", "colonial"],
    "community":  ["community", "australian communities", "city", "suburb", "people"],
    "art":        ["art", "drawing", "painting", "colour", "creative arts", "sculpture"],
    "music":      ["music", "song", "rhythm", "instrument"],
    "writing":    ["writing", "story", "narrative", "persuasive", "poetry", "english"],
    "religion":   ["religion", "humanity", "values", "ethics"],
    "architecture": ["architecture", "building", "design", "engineering"],
}

# ─────────────────────────────────────────────────────────────────────────────
# Curated mock Sydney events (used when EVENTS_API_URL is not configured).
# Each event:
#   title, venue, suburb, date_range, age_min, cost ($/$$/$$$/free),
#   category, concepts[], description, url,
#   religious_venue (bool), religion (None | 'catholic'|'muslim'|...)
# ─────────────────────────────────────────────────────────────────────────────

MOCK_SYDNEY_EVENTS: list[dict[str, Any]] = [
    {
        "title": "Sydney Opera House — Family Architecture Tour",
        "venue": "Sydney Opera House",
        "suburb": "Sydney CBD",
        "date_range": "Every Saturday & Sunday, 10am",
        "age_min": 6,
        "cost": "$$",
        "category": "architecture",
        "concepts": ["geometry", "architecture", "music", "design", "engineering"],
        "description": (
            "Walk under the famous sail roof and discover how it was built from "
            "1,056 precast concrete sections — all sliced from one giant sphere. "
            "Kids see triangles, arches and curves come alive."
        ),
        "url": "https://www.sydneyoperahouse.com/visit-us/tours",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Powerhouse Museum — Hands-on Science Lab",
        "venue": "Powerhouse Museum",
        "suburb": "Ultimo",
        "date_range": "Daily, 10am – 5pm",
        "age_min": 4,
        "cost": "$$",
        "category": "science",
        "concepts": ["physics", "matter", "engineering", "energy"],
        "description": (
            "Touch real steam engines, experiment with magnets, and watch water "
            "change between solid, liquid and gas in the live science demos."
        ),
        "url": "https://powerhouse.com.au",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Taronga Zoo — Wild Australia Trail",
        "venue": "Taronga Zoo",
        "suburb": "Mosman",
        "date_range": "Daily, 9:30am – 4:30pm",
        "age_min": 3,
        "cost": "$$$",
        "category": "biology",
        "concepts": ["biology", "habitats", "adaptation", "food chain"],
        "description": (
            "Meet kangaroos, koalas and platypus in habitats that show exactly "
            "how each animal survives — perfect for ecosystem and food-chain lessons."
        ),
        "url": "https://taronga.org.au",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Royal Botanic Garden — Aboriginal Heritage Walk",
        "venue": "Royal Botanic Garden",
        "suburb": "Sydney CBD",
        "date_range": "Wed, Fri, Sun 10am",
        "age_min": 5,
        "cost": "free",
        "category": "history",
        "concepts": ["history", "community", "biology", "indigenous"],
        "description": (
            "A guided walk with First Nations educators showing native plants used "
            "as food, medicine and tools. Ties into Year 3–6 'Australian Communities'."
        ),
        "url": "https://www.botanicgardens.org.au",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Australian Museum — First Nations Gallery",
        "venue": "Australian Museum",
        "suburb": "Sydney CBD",
        "date_range": "Daily, 10am – 5pm",
        "age_min": 5,
        "cost": "free",
        "category": "history",
        "concepts": ["history", "community", "indigenous", "art"],
        "description": (
            "See real artefacts and storytelling from over 250 First Nations "
            "communities. Kids can sketch what they see in the free activity sheets."
        ),
        "url": "https://australian.museum",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Art Gallery of NSW — Kids Drawing Workshop",
        "venue": "Art Gallery of NSW",
        "suburb": "The Domain",
        "date_range": "Saturdays, 11am",
        "age_min": 5,
        "cost": "free",
        "category": "art",
        "concepts": ["art", "geometry", "writing"],
        "description": (
            "Free 45-minute workshop where kids sketch a famous painting and "
            "learn about colour, shape and storytelling through art."
        ),
        "url": "https://www.artgallery.nsw.gov.au",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Sydney Observatory — Family Stargazing",
        "venue": "Sydney Observatory",
        "suburb": "The Rocks",
        "date_range": "Friday & Saturday evenings",
        "age_min": 7,
        "cost": "$$",
        "category": "science",
        "concepts": ["space", "physics"],
        "description": (
            "See Saturn's rings and Jupiter's moons through real telescopes. "
            "An astronomer guides families through the night sky over Sydney Harbour."
        ),
        "url": "https://maas.museum/sydney-observatory",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Australian National Maritime Museum — Tall Ships & Submarines",
        "venue": "Australian National Maritime Museum",
        "suburb": "Darling Harbour",
        "date_range": "Daily, 10am – 4pm",
        "age_min": 4,
        "cost": "$",
        "category": "history",
        "concepts": ["history", "physics", "community"],
        "description": (
            "Climb aboard a real submarine and a tall ship. Hands-on stations "
            "show how buoyancy and navigation work."
        ),
        "url": "https://www.sea.museum",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Centennial Parklands — Family Bike & Nature Loop",
        "venue": "Centennial Parklands",
        "suburb": "Centennial Park",
        "date_range": "Open daily, sunrise – sunset",
        "age_min": 3,
        "cost": "free",
        "category": "nature",
        "concepts": ["biology", "physics", "community"],
        "description": (
            "A 3.6 km flat loop perfect for first-time cyclists. Spot ducks, "
            "ibis and turtles in the ponds — great for life-cycle observation."
        ),
        "url": "https://www.centennialparklands.com.au",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "Hyde Park Barracks — Convict Sydney",
        "venue": "Sydney Living Museums",
        "suburb": "Sydney CBD",
        "date_range": "Daily, 10am – 4pm",
        "age_min": 7,
        "cost": "$",
        "category": "history",
        "concepts": ["history", "community", "writing"],
        "description": (
            "Self-guided audio tour where kids hear the voices of real convict "
            "children who lived here. Strong tie-in to Year 4–6 Australian history."
        ),
        "url": "https://sydneylivingmuseums.com.au/hyde-park-barracks",
        "religious_venue": False,
        "religion": None,
    },
    {
        "title": "St Mary's Cathedral — Family Heritage Tour",
        "venue": "St Mary's Cathedral",
        "suburb": "Sydney CBD",
        "date_range": "Sundays after 10:30am Mass",
        "age_min": 5,
        "cost": "free",
        "category": "religion",
        "concepts": ["religion", "history", "architecture"],
        "description": (
            "Gothic Revival cathedral tour explaining the symbolism in the stained "
            "glass and the cathedral's role in the Catholic community of Sydney."
        ),
        "url": "https://www.stmaryscathedral.org.au",
        "religious_venue": True,
        "religion": "catholic",
    },
    {
        "title": "Lakemba Mosque — Open Day Family Visit",
        "venue": "Lakemba Mosque",
        "suburb": "Lakemba",
        "date_range": "Saturdays, 10am – 2pm",
        "age_min": 5,
        "cost": "free",
        "category": "religion",
        "concepts": ["religion", "history", "architecture", "community"],
        "description": (
            "A welcoming open day where families learn about Islamic culture, "
            "calligraphy and the role of the mosque in the local community."
        ),
        "url": "https://www.lmaaustralia.org.au",
        "religious_venue": True,
        "religion": "muslim",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers (no @tool — for use inside the tools below)
# ─────────────────────────────────────────────────────────────────────────────

def _get_db():
    """Lazy Supabase client. Returns (client, error_message_or_None)."""
    from db.supabase import get_supabase
    try:
        return get_supabase(), None
    except Exception as exc:  # pragma: no cover - depends on env
        return None, f"[DB not configured: {exc}]"


def _safe_json_loads(value: Any, fallback: Any) -> Any:
    if value is None:
        return fallback
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return fallback


def _age_for_year_level(year_level: str) -> int:
    if not year_level:
        return 8  # Year 3 default
    return YEAR_LEVEL_AGE.get(year_level.strip(), 8)


def _expand_concept_keywords(text: str) -> set[str]:
    """Map free-text concept(s) to a flat keyword set."""
    text_lower = (text or "").lower()
    keywords: set[str] = set()
    for group, words in CONCEPT_KEYWORDS.items():
        if group in text_lower:
            keywords.update(words)
            keywords.add(group)
        for word in words:
            if word in text_lower:
                keywords.update(words)
                keywords.add(group)
                break
    if not keywords:
        keywords = {w.strip() for w in text_lower.split() if len(w.strip()) > 3}
    return keywords


def _score_event(
    event: dict[str, Any],
    keywords: set[str],
    family: dict[str, Any],
    child_age: int,
) -> tuple[int, str]:
    """Return (score, reason). Higher score = better match."""
    if event.get("age_min", 0) > child_age:
        return -1, "child too young"

    # Religion gating: religious venues only allowed when family explicitly matches.
    if event.get("religious_venue"):
        family_religion = (family.get("religion") or "").lower().strip()
        event_religion = (event.get("religion") or "").lower().strip()
        if not family_religion or family_religion != event_religion:
            return -1, "religious venue not aligned with family"

    score = 0
    matched: list[str] = []

    # Concept overlap (strongest signal).
    for concept in event.get("concepts", []):
        if concept.lower() in keywords:
            score += 3
            matched.append(concept)

    # Category overlap.
    if event.get("category", "").lower() in keywords:
        score += 2
        matched.append(event["category"])

    # Family interest match (small boost).
    interests = {i.lower() for i in family.get("interests", [])}
    if event.get("category", "").lower() in interests:
        score += 1

    # Suburb proximity (only matters when transport is limited).
    if family.get("transport") == "limited":
        family_suburb = (family.get("suburb") or "").lower().strip()
        if family_suburb and family_suburb in event.get("suburb", "").lower():
            score += 2
        elif family_suburb:
            score -= 1  # outside the area, penalty for limited-transport family

    # Budget alignment.
    budget = family.get("budget_level", "medium")
    cost = event.get("cost", "free")
    if budget == "low" and cost in ("$$", "$$$"):
        score -= 1
    if budget == "low" and cost in ("free", "$"):
        score += 1

    if score <= 0:
        return score, "no clear curriculum match"

    if matched:
        reason = f"links to {', '.join(matched[:3])}"
    else:
        reason = "general family fit"
    return score, reason


# ─────────────────────────────────────────────────────────────────────────────
# Tools
# ─────────────────────────────────────────────────────────────────────────────

@tool
def suggestion_get_family_background(parent_clerk_id: str, class_id: str = "") -> str:
    """Read the family's background profile (religion, suburb, interests, etc.).

    Returns a JSON string with keys: religion, cultural_origin, languages_spoken,
    suburb, interests, family_size, transport, budget_level, weekend_availability.
    Missing fields fall back to neutral defaults so callers can rely on the keys.

    Args:
        parent_clerk_id: Clerk user ID of the parent.
        class_id: Optional class UUID to scope the lookup; if empty, takes any row
            for this parent.
    """
    db, err = _get_db()
    if err:
        return json.dumps({**DEFAULT_FAMILY_BACKGROUND, "_note": err})

    try:
        query = db.table("class_parents") \
            .select("family_background, preferred_language, child_name, class_id") \
            .eq("parent_clerk_id", parent_clerk_id)
        if class_id:
            query = query.eq("class_id", class_id)
        rows = query.limit(1).execute()
    except Exception as exc:
        # Likely missing column → graceful fallback.
        logger.warning("family_background lookup failed: %s", exc)
        return json.dumps({**DEFAULT_FAMILY_BACKGROUND, "_note": str(exc)})

    if not rows.data:
        return json.dumps(DEFAULT_FAMILY_BACKGROUND)

    row = rows.data[0]
    bg = _safe_json_loads(row.get("family_background"), {}) or {}
    merged = {**DEFAULT_FAMILY_BACKGROUND, **bg}

    # Surface convenience fields the agent often needs.
    if row.get("preferred_language") and "languages_spoken" not in bg:
        merged["languages_spoken"] = [row["preferred_language"]]
    if row.get("child_name"):
        merged["child_name"] = row["child_name"]
    return json.dumps(merged)


@tool
def suggestion_get_recent_classwork(class_id: str, limit: int = 3) -> str:
    """Fetch the most recent processed briefs for a class so the agent knows
    what the children just learned.

    Returns a JSON list of {brief_id, subject, year_level, content_type,
    processed_en, at_home_activities, published_at}, newest first.

    Args:
        class_id: UUID of the class.
        limit: How many recent briefs to return (default 3, max 10).
    """
    limit = max(1, min(int(limit or 3), 10))
    db, err = _get_db()
    if err:
        return json.dumps({"briefs": [], "note": err})

    try:
        rows = db.table("briefs") \
            .select("id, subject, year_level, content_type, processed_en, "
                    "at_home_activities, published_at") \
            .eq("class_id", class_id) \
            .eq("status", "done") \
            .order("published_at", desc=True) \
            .limit(limit).execute()
    except Exception as exc:
        return json.dumps({"briefs": [], "note": str(exc)})

    briefs = [
        {
            "brief_id": r["id"],
            "subject": r.get("subject"),
            "year_level": r.get("year_level"),
            "content_type": r.get("content_type"),
            "processed_en": r.get("processed_en"),
            "at_home_activities": r.get("at_home_activities") or [],
            "published_at": r.get("published_at"),
        }
        for r in (rows.data or [])
    ]
    return json.dumps({"briefs": briefs, "count": len(briefs)})


@tool
async def suggestion_fetch_local_events(
    suburb: str = "Sydney",
    category: str = "any",
    weeks_ahead: int = 4,
) -> str:
    """Fetch upcoming family-friendly events around Sydney.

    If EVENTS_API_URL env var is set, calls that endpoint. Otherwise returns
    a curated mock list of Sydney venues so the agent can still demo offline.

    Args:
        suburb: Family's suburb or 'Sydney' for a city-wide search.
        category: Optional filter such as 'science', 'art', 'history', 'nature',
            'religion', or 'any'.
        weeks_ahead: How many weeks of events to look at (default 4).
    """
    base_url = os.getenv("EVENTS_API_URL")
    api_key = os.getenv("EVENTS_API_KEY", "")
    weeks_ahead = max(1, min(int(weeks_ahead or 4), 12))

    if base_url:
        params = {
            "suburb": suburb,
            "category": category,
            "from": datetime.now(timezone.utc).date().isoformat(),
            "to": (datetime.now(timezone.utc) + timedelta(weeks=weeks_ahead))
                  .date().isoformat(),
        }
        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(base_url, params=params, headers=headers)
            if resp.status_code == 200:
                payload = resp.json()
                events = payload if isinstance(payload, list) else payload.get("events", [])
                return json.dumps({"source": "live", "events": events})
            logger.warning(
                "events API returned %s, falling back to mock", resp.status_code
            )
        except Exception as exc:
            logger.warning("events API call failed (%s), using mock", exc)

    # Mock fallback.
    events = MOCK_SYDNEY_EVENTS
    if category and category != "any":
        events = [e for e in events if e["category"].lower() == category.lower()]
    return json.dumps({"source": "mock", "events": events})


@tool
def suggestion_match_event_to_concept(
    events_json: str,
    learning_concept: str,
    year_level: str = "Year 3",
    family_background_json: str = "{}",
    top_n: int = 3,
) -> str:
    """Score and rank events for a specific learning concept and family.

    Filters out events whose age_min exceeds the child's age and excludes
    religious venues unless the family's religion explicitly matches.

    Args:
        events_json: JSON string from suggestion_fetch_local_events.
        learning_concept: Concept the child is learning (e.g. "geometry shapes",
            "states of matter", "Australian communities").
        year_level: Australian year level ("Year 1" through "Year 6").
        family_background_json: JSON string from suggestion_get_family_background.
        top_n: How many top picks to return (1–5, default 3).
    """
    payload = _safe_json_loads(events_json, {})
    events: list[dict[str, Any]] = payload.get("events", []) if isinstance(payload, dict) else []
    family = _safe_json_loads(family_background_json, {}) or {}
    family = {**DEFAULT_FAMILY_BACKGROUND, **family}

    keywords = _expand_concept_keywords(learning_concept)
    child_age = _age_for_year_level(year_level)

    scored: list[dict[str, Any]] = []
    for event in events:
        score, reason = _score_event(event, keywords, family, child_age)
        if score <= 0:
            continue
        scored.append({
            "title": event.get("title"),
            "venue": event.get("venue"),
            "suburb": event.get("suburb"),
            "date_range": event.get("date_range"),
            "cost": event.get("cost"),
            "category": event.get("category"),
            "url": event.get("url"),
            "description": event.get("description"),
            "score": score,
            "reason": reason,
            "learning_link": (
                f"While at {event.get('venue')}, point out {reason} — "
                f"connects to {learning_concept}."
            ),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    top_n = max(1, min(int(top_n or 3), 5))
    return json.dumps({
        "concept": learning_concept,
        "year_level": year_level,
        "child_age": child_age,
        "matches": scored[:top_n],
        "total_considered": len(events),
    })


@tool
def suggestion_save_to_brief(brief_id: str, suggestions_json: str) -> str:
    """Append event-outing suggestions to a brief's at_home_activities so they
    show up in the parent's inbox.

    Each suggestion becomes an activity entry tagged with type='event_outing'.

    Args:
        brief_id: UUID of the brief to attach the suggestions to.
        suggestions_json: JSON string from suggestion_match_event_to_concept
            (the object containing the 'matches' list).
    """
    db, err = _get_db()
    if err:
        return json.dumps({"saved": False, "note": err})

    payload = _safe_json_loads(suggestions_json, {})
    matches = payload.get("matches", []) if isinstance(payload, dict) else []
    if not matches:
        return json.dumps({"saved": False, "note": "no matches to save"})

    new_activities = [
        {
            "type": "event_outing",
            "title": m.get("title"),
            "venue": m.get("venue"),
            "suburb": m.get("suburb"),
            "when": m.get("date_range"),
            "cost": m.get("cost"),
            "url": m.get("url"),
            "description": m.get("description"),
            "learning_link": m.get("learning_link"),
            "duration_mins": 90,
        }
        for m in matches
    ]

    try:
        existing = db.table("briefs").select("at_home_activities") \
            .eq("id", brief_id).limit(1).execute()
        current = []
        if existing.data and existing.data[0].get("at_home_activities"):
            current = _safe_json_loads(existing.data[0]["at_home_activities"], [])
        merged = list(current) + new_activities
        db.table("briefs").update({"at_home_activities": merged}) \
            .eq("id", brief_id).execute()
    except Exception as exc:
        return json.dumps({"saved": False, "note": str(exc)})

    return json.dumps({"saved": True, "added": len(new_activities), "brief_id": brief_id})


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def get_tools():
    """Return all tools for the suggestion subagent."""
    return [
        suggestion_get_family_background,
        suggestion_get_recent_classwork,
        suggestion_fetch_local_events,
        suggestion_match_event_to_concept,
        suggestion_save_to_brief,
    ]
