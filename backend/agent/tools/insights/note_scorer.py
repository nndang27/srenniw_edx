"""
Note → Numeric Dimensions Scorer
=================================
Two implementations:

1. score_note_fast(note_text, note_type) → dict
   Keyword-based, deterministic, used for batch pre-scoring (data generation, tests).

2. score_note_with_ai (LangChain @tool)
   LLM-based (minimax via Ollama), used for new real-time entries.
   Falls back to score_note_fast if LLM is unavailable.

Parent note dimensions (6):
  emotion_sentiment       : 1.0–5.0  Overall tone
  parent_child_connection : 0.0–1.0  Interaction quality
  activity_level          : 0.0–1.0  Physical energy / movement
  social_engagement       : 0.0–1.0  Peer / sibling interaction
  curiosity_index         : 0.0–1.0  Intellectual curiosity
  focus_depth             : 0.0–1.0  Self-directed deep focus

Teacher note dimensions (4):
  emotion_sentiment       : 1.0–5.0  Tone of feedback
  encouragement_level     : 0.0–1.0  Positive reinforcement
  difficulty_signal       : 0.0–1.0  Struggle indicators
  engagement_observed     : 0.0–1.0  Classroom participation
"""
import json
import re
from langchain_core.tools import tool

# ─── Keyword banks (Vietnamese + English) ────────────────────────────────────

_SENTIMENT_POS = [
    "vui", "hào hứng", "thích", "tuyệt", "hay", "tốt", "rất tốt", "xuất sắc",
    "excited", "happy", "great", "excellent", "wonderful", "enjoyed", "loved",
    "thành công", "đạt được", "khen", "tự hào", "proud",
]
_SENTIMENT_NEG = [
    "lo lắng", "buồn", "khóc", "sợ", "không muốn", "chán", "khó chịu",
    "anxious", "sad", "cry", "worried", "refused", "frustrated", "struggled",
    "tired", "mệt", "không vui", "cáu",
]
_PARENT_CONNECT = [
    "hỏi", "kể", "cùng", "chúng tôi", "bố mẹ", "mình", "nói chuyện",
    "asked", "told me", "together", "we", "explained", "show me", "shared",
    "chia sẻ", "tâm sự", "bảo",
]
_ACTIVITY = [
    "chạy", "nhảy", "leo", "trèo", "đá bóng", "bơi", "hoạt động", "không ngồi yên",
    "run", "jump", "climb", "active", "energetic", "sports", "exercise", "play",
    "chơi", "vận động", "nhanh nhẹn",
]
_SOCIAL = [
    "bạn bè", "nhường", "chia sẻ", "nhóm", "cùng bạn", "giúp đỡ", "chơi cùng",
    "friends", "group", "share", "help", "together", "kind", "care", "sibling",
    "em", "anh", "chị", "hàng xóm",
]
_CURIOSITY = [
    "tại sao", "hỏi", "khám phá", "tìm hiểu", "thắc mắc", "muốn biết",
    "why", "wonder", "explore", "curious", "question", "discover", "investigate",
    "tò mò", "thử", "nghiên cứu",
]
_FOCUS = [
    "tự làm", "tập trung", "kiên nhẫn", "một mình", "im lặng", "chăm chú",
    "alone", "focused", "concentrated", "patient", "self-directed", "quiet",
    "persistent", "tự học", "không cần nhắc",
]

_TEACHER_ENCOURAGE = [
    "great", "excellent", "well done", "good job", "fantastic", "impressive",
    "tốt", "giỏi", "xuất sắc", "khen", "outstanding", "superb", "keep it up",
]
_TEACHER_STRUGGLE = [
    "struggled", "needs support", "difficult", "challenging", "needs practice",
    "khó", "chưa hiểu", "cần luyện tập", "chưa nắm", "still learning",
    "needs improvement", "working on",
]
_TEACHER_ENGAGE = [
    "participated", "engaged", "attentive", "active", "contributed", "asked",
    "tham gia", "chú ý", "hỏi", "đóng góp", "responded", "raised hand",
]


def _hit_ratio(text: str, keywords: list[str]) -> float:
    """Return fraction of keywords found in text (capped at 1.0)."""
    text_lower = text.lower()
    hits = sum(1 for kw in keywords if kw.lower() in text_lower)
    return min(1.0, hits / max(1, len(keywords) * 0.15))


def score_note_fast(note_text: str, note_type: str = "parent") -> dict:
    """
    Keyword-based fast scorer. Deterministic, no LLM.

    Args:
        note_text:  Free text (Vietnamese / English / mixed).
        note_type:  "parent" or "teacher".

    Returns:
        dict with numeric dimensions.
    """
    if not note_text or not note_text.strip():
        if note_type == "teacher":
            return {"emotion_sentiment": 3.0, "encouragement_level": 0.5,
                    "difficulty_signal": 0.0, "engagement_observed": 0.5}
        return {"emotion_sentiment": 3.0, "parent_child_connection": 0.3,
                "activity_level": 0.3, "social_engagement": 0.3,
                "curiosity_index": 0.3, "focus_depth": 0.3}

    text = note_text.strip()
    pos = _hit_ratio(text, _SENTIMENT_POS)
    neg = _hit_ratio(text, _SENTIMENT_NEG)
    # Map to 1–5 scale: neutral=3, all pos=5, all neg=1
    sentiment = round(3.0 + pos * 2.0 - neg * 2.0, 2)
    sentiment = max(1.0, min(5.0, sentiment))

    if note_type == "teacher":
        return {
            "emotion_sentiment":   sentiment,
            "encouragement_level": round(min(1.0, _hit_ratio(text, _TEACHER_ENCOURAGE) * 2), 2),
            "difficulty_signal":   round(min(1.0, _hit_ratio(text, _TEACHER_STRUGGLE) * 2), 2),
            "engagement_observed": round(min(1.0, _hit_ratio(text, _TEACHER_ENGAGE) * 2), 2),
        }

    # parent
    return {
        "emotion_sentiment":       sentiment,
        "parent_child_connection": round(min(1.0, _hit_ratio(text, _PARENT_CONNECT) * 2.5), 2),
        "activity_level":          round(min(1.0, _hit_ratio(text, _ACTIVITY) * 3), 2),
        "social_engagement":       round(min(1.0, _hit_ratio(text, _SOCIAL) * 2.5), 2),
        "curiosity_index":         round(min(1.0, _hit_ratio(text, _CURIOSITY) * 3), 2),
        "focus_depth":             round(min(1.0, _hit_ratio(text, _FOCUS) * 3), 2),
    }


# ─── AI scorer (LangChain @tool) ─────────────────────────────────────────────

_AI_PROMPT_PARENT = """You are a child development analyst. Given a parent note about their child's day,
extract numeric scores for these 6 dimensions. Return ONLY valid JSON, no commentary.

Dimensions:
- emotion_sentiment: 1.0 (very negative) to 5.0 (very positive)
- parent_child_connection: 0.0 to 1.0 (quality of parent-child interaction)
- activity_level: 0.0 to 1.0 (physical energy / movement described)
- social_engagement: 0.0 to 1.0 (peer/sibling interaction)
- curiosity_index: 0.0 to 1.0 (intellectual curiosity shown)
- focus_depth: 0.0 to 1.0 (self-directed deep focus)

Note: "{note}"

Return exactly: {{"emotion_sentiment": X, "parent_child_connection": X, "activity_level": X, "social_engagement": X, "curiosity_index": X, "focus_depth": X}}"""

_AI_PROMPT_TEACHER = """You are a child development analyst. Given a teacher's note about a student,
extract numeric scores for these 4 dimensions. Return ONLY valid JSON, no commentary.

Dimensions:
- emotion_sentiment: 1.0 (very negative feedback) to 5.0 (very positive feedback)
- encouragement_level: 0.0 to 1.0 (positive reinforcement in note)
- difficulty_signal: 0.0 to 1.0 (struggle / needs support signals)
- engagement_observed: 0.0 to 1.0 (classroom participation observed)

Note: "{note}"

Return exactly: {{"emotion_sentiment": X, "encouragement_level": X, "difficulty_signal": X, "engagement_observed": X}}"""


@tool
def score_note_with_ai(note_text: str, note_type: str = "parent") -> str:
    """
    Use LLM (minimax via Ollama) to extract numeric development dimensions from a note.

    Use this tool for new real-time journal entries where pre-scored data is not available.
    Falls back to keyword-based scoring if LLM is unavailable.

    Args:
        note_text: Free-text parent or teacher note (Vietnamese / English / mixed).
        note_type: "parent" returns 6 dimensions; "teacher" returns 4 dimensions.

    Returns:
        JSON string with numeric dimension scores.
    """
    import os
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage

        base_url = os.environ.get("CURRICULLM_BASE_URL", "http://localhost:11434/v1")
        api_key = os.environ.get("CURRICULLM_API_KEY", "ollama")
        model_name = os.environ.get("CURRICULLM_MODEL", "minimax-m2.5:cloud")

        llm = ChatOpenAI(
            model=model_name,
            base_url=base_url,
            api_key=api_key,
            temperature=0.0,
            max_tokens=200,
        )

        prompt = (
            _AI_PROMPT_PARENT.format(note=note_text)
            if note_type == "parent"
            else _AI_PROMPT_TEACHER.format(note=note_text)
        )

        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()

        # Extract JSON from response (model may add markdown)
        match = re.search(r'\{[^}]+\}', content, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            # Clamp all values to valid ranges
            if note_type == "parent":
                parsed["emotion_sentiment"] = max(1.0, min(5.0, float(parsed.get("emotion_sentiment", 3))))
                for k in ["parent_child_connection", "activity_level", "social_engagement", "curiosity_index", "focus_depth"]:
                    parsed[k] = max(0.0, min(1.0, float(parsed.get(k, 0.3))))
            else:
                parsed["emotion_sentiment"] = max(1.0, min(5.0, float(parsed.get("emotion_sentiment", 3))))
                for k in ["encouragement_level", "difficulty_signal", "engagement_observed"]:
                    parsed[k] = max(0.0, min(1.0, float(parsed.get(k, 0.5))))
            return json.dumps(parsed)

        raise ValueError(f"No JSON found in response: {content[:100]}")

    except Exception:
        # Silent fallback to keyword scorer
        return json.dumps(score_note_fast(note_text, note_type))
