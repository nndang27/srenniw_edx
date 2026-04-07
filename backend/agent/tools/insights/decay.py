"""
Time-decay weighting for insight tools.

Exponential decay: w(t) = 0.5 ^ (days_ago / half_life_days)

Half-life defaults per tool context:
  - HALF_LIFE_EMOTION     : 30 days  (recent mood matters most)
  - HALF_LIFE_COGNITION   : 60 days  (learning momentum)
  - HALF_LIFE_VARK        : 90 days  (learning style is slower to change)
  - HALF_LIFE_PERSONALITY : 120 days (personality traits are stable)
  - HALF_LIFE_INTELLIGENCE: 120 days (intelligences build slowly)
  - HALF_LIFE_RIASEC      : 120 days (career signals inherit intelligences)
"""
import datetime


HALF_LIFE_EMOTION     = 30
HALF_LIFE_COGNITION   = 60
HALF_LIFE_VARK        = 90
HALF_LIFE_PERSONALITY = 120
HALF_LIFE_INTELLIGENCE = 120
HALF_LIFE_RIASEC      = 120


def decay_weight(date_str: str, ref_date: str | None = None, half_life_days: int = 90) -> float:
    """
    Return exponential decay weight for a journal entry.

    Args:
        date_str:       Entry date as "YYYY-MM-DD".
        ref_date:       Reference date (default = today). Used to make tests reproducible.
        half_life_days: Days for weight to drop to 0.5.

    Returns:
        float in (0, 1]. Very old data approaches 0 but never reaches it.
    """
    try:
        ref = (
            datetime.date.fromisoformat(ref_date[:10])
            if ref_date
            else datetime.date.today()
        )
        entry = datetime.date.fromisoformat(date_str[:10])
        days_ago = max(0, (ref - entry).days)
        return 0.5 ** (days_ago / half_life_days)
    except (ValueError, TypeError):
        return 1.0  # unknown date → no penalty


def effective_entries(entries: list[dict], ref_date: str | None = None, half_life_days: int = 90) -> list[dict]:
    """
    Return entries annotated with their decay weight.
    Adds '_weight' key to each entry dict copy.
    """
    result = []
    for e in entries:
        w = decay_weight(e.get("date", ""), ref_date, half_life_days)
        result.append({**e, "_weight": w})
    return result
