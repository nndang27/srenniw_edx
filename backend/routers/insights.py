"""
Insights Router — Child Development Dashboard API
==================================================
POST /api/parent/insights        — live journal data
GET  /api/parent/insights/demo   — 400-day mock dataset (for UI demo)
POST /api/parent/insights/ai     — LLM-enhanced via Ollama
"""
import json
import os
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Auth is optional here — uncomment when Clerk is configured
# from auth import require_parent

router = APIRouter(prefix="/api/parent", tags=["insights"])


# ─── Request / Response schemas ───────────────────────────────────────────────

class JournalEntryInput(BaseModel):
    date: str                        # YYYY-MM-DD
    subject: str
    cognitiveLevel: int = Field(ge=1, le=5)
    emotion: str = "Neutral"
    notes: str = ""


class InsightsRequest(BaseModel):
    entries: list[JournalEntryInput]
    child_age: int = Field(default=9, ge=3, le=18)
    curriculum_benchmark: float = Field(default=3.0, ge=1.0, le=5.0)
    app_usage_streak: int = Field(default=0, ge=0)


# ─── Route ────────────────────────────────────────────────────────────────────

@router.post("/insights")
async def get_insights(body: InsightsRequest):
    """
    Compute all 6 child development insight sections from journal data.

    This endpoint runs the 6 analytical tools directly (no LLM needed).
    Returns a single JSON object with keys:
      intelligences, vark, cognition, emotion, personality, career
    """
    try:
        entries_dicts = [e.model_dump() for e in body.entries]
        return _run_tools_on_entries(
            entries=entries_dicts,
            child_age=body.child_age,
            curriculum_benchmark=body.curriculum_benchmark,
            app_usage_streak=body.app_usage_streak,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ─── Demo endpoint ────────────────────────────────────────────────────────────

def _run_tools_on_entries(entries: list[dict], child_age: int = 9,
                           curriculum_benchmark: float = 3.0,
                           app_usage_streak: int = 14,
                           ref_date: str = "") -> dict:
    """Shared computation used by both live and demo endpoints."""
    from agent.tools.insights import (
        calculate_multiple_intelligences,
        analyze_vark_style,
        calculate_riasec_clusters,
        analyze_cognition_growth,
        analyze_perma_wellbeing,
        calculate_ocean_traits,
    )

    entries_json = json.dumps(entries, ensure_ascii=False)

    # Subject averages (school entries only)
    subject_totals: dict[str, list] = {}
    for e in entries:
        subj = e.get("subject")
        lvl = e.get("cognitiveLevel")
        if subj and lvl:
            subject_totals.setdefault(subj, []).append(lvl)
    subject_avgs = {s: round(sum(vs) / len(vs), 2) for s, vs in subject_totals.items()}

    intel_raw = calculate_multiple_intelligences.invoke(
        {"entries_json": entries_json, "ref_date": ref_date}
    )
    vark_raw = analyze_vark_style.invoke(
        {"entries_json": entries_json, "ref_date": ref_date}
    )
    cognition_raw = analyze_cognition_growth.invoke({
        "entries_json": entries_json,
        "age": child_age,
        "curriculum_benchmark": curriculum_benchmark,
        "ref_date": ref_date,
    })
    emotion_raw = analyze_perma_wellbeing.invoke({"entries_json": entries_json})
    personality_raw = calculate_ocean_traits.invoke({
        "entries_json": entries_json,
        "app_usage_streak": app_usage_streak,
        "ref_date": ref_date,
    })
    intel_data = json.loads(intel_raw)
    career_raw = calculate_riasec_clusters.invoke({
        "intelligence_scores_json": json.dumps(intel_data.get("radar_data", {})),
        "subject_strengths_json": json.dumps(subject_avgs),
    })
    return {
        "intelligences": intel_data,
        "vark":          json.loads(vark_raw),
        "cognition":     json.loads(cognition_raw),
        "emotion":       json.loads(emotion_raw),
        "personality":   json.loads(personality_raw),
        "career":        json.loads(career_raw),
        "meta": {
            "entry_count": len(entries),
            "subject_avgs": subject_avgs,
            "demo": False,
        },
    }


@router.get("/insights/demo")
async def get_demo_insights():
    """
    Return pre-computed insights from the 400-day mock dataset.
    Used by the frontend when no real journal data is available.
    """
    # Locate mock data file relative to this file
    demo_path = os.path.join(
        os.path.dirname(__file__), "..", "tests", "data", "mock_data_400days.json"
    )
    demo_path = os.path.normpath(demo_path)

    if not os.path.exists(demo_path):
        raise HTTPException(status_code=404, detail="Demo data file not found. Run generate_mock_400days.py first.")

    try:
        with open(demo_path, encoding="utf-8") as f:
            entries = json.load(f)

        result = _run_tools_on_entries(
            entries=entries,
            child_age=9,
            curriculum_benchmark=3.0,
            app_usage_streak=14,
            ref_date="2026-04-06",  # fixed ref so demo is reproducible
        )
        result["meta"]["demo"] = True
        result["meta"]["demo_days"] = 400
        result["meta"]["student"] = "Minh An, Age 9, Year 4"
        return result

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/insights/ai")
async def get_insights_ai(body: InsightsRequest):
    """
    LLM-enhanced insights using minimax-m2.5:cloud via Ollama.
    Same output as /insights but with richer AI-generated narrative messages.
    """
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage
    from agent.core.graph import create_deep_agent
    from agent.subagents.insights_agent import SYSTEM_PROMPT, get_tools

    entries_dicts = [e.model_dump() for e in body.entries]
    entries_json = json.dumps(entries_dicts, ensure_ascii=False)

    request_text = (
        f"Analyze this child's development. "
        f"Age: {body.child_age}. Curriculum benchmark: {body.curriculum_benchmark}. "
        f"App usage streak: {body.app_usage_streak} days.\n\n"
        f"Journal data:\n{entries_json}"
    )

    try:
        model = ChatOpenAI(
            model="minimax-m2.5:cloud",
            base_url="http://localhost:11434/v1",
            api_key="ollama",
            temperature=0.3,
        )
        agent = create_deep_agent(
            model=model,
            tools=get_tools(),
            system_prompt=SYSTEM_PROMPT,
            subagents=[],
        )
        result = await agent.ainvoke({"messages": [HumanMessage(content=request_text)]})
        messages = result.get("messages", [])
        final_content = messages[-1].content if messages else "{}"
        try:
            return json.loads(final_content)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail=f"Agent returned non-JSON: {final_content[:200]}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
