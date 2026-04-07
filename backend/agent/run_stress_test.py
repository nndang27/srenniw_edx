"""
STRESS TEST SUITE — Srenniw Digest Agent Pipeline
══════════════════════════════════════════════════════
Runs all 3 test cases from testcase_duc.md through the full
DeepDive → TikTokPull → Summarize pipeline.

Intentionally avoids importing agent.core.* (requires internal langchain fork
and Python 3.11+). System prompts are inlined; tools are imported directly.

Run:
    cd backend
    venv39/bin/python -m agent.run_stress_test
"""
import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ── Mock Ollama as CurricuLLM ─────────────────────────────────────────────────
os.environ.setdefault("CURRICULLM_BASE_URL", "http://localhost:11434")
os.environ.setdefault("CURRICULLM_API_KEY", "ollama")
os.environ.setdefault("CURRICULLM_MODEL", "minimax-m2.5:cloud")
_STRESS_TEST_MODEL = "minimax-m2.5:cloud"

from typing import Optional
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI

# ── Import tools directly (no agent.core dependency) ─────────────────────────
from agent.tools.summarize import (
    summarize_search_tiktok,
    summarize_download_tiktok,
    summarize_fetch_material_from_cloud,
)
from agent.tools.curricullm_tools import curricullm_generate

# ── Inlined system prompts (copied from subagent files) ──────────────────────

DD_PROMPT = """Srenniw Digest Agent Logic Structure - Deep Dive Phase

Step 1: Take in the Material and Apply the Rules
INPUT: Raw classroom materials (teacher slides, reading assignments, etc.) provided in your context.
Global Constraints: * Keep it completely family-friendly (G-rated).
Do not invent any outside information (Strictly stick to the INPUT).

Step 3: The AI Thinking (Deep Dive & Video Keywords)

Think 2 - Deep Dive: Break down the lecture knowledge (INPUT).
Core Concept: explain the topic in a detailed academic tone. (Limit: 40-60 words). Use formal academic language. Start directly with the definition.
Key Vocabulary: Exactly 2 to 4 important terms. (15-25 words each). Must physically exist in the INPUT text. Make definitions standalone.
Why This Matters: practical use case outside the classroom. (Limit: 40-60 words).

Think 3 - Pick Video Search Keywords:
Scan the lecture knowledge (INPUT) for highly visual concepts to be used for video searches later.
Limit: 1 to 2 short phrases. Strictly 2 to 4 words long. At least one word must imply motion/visuals. Strip filler words.

You MUST wrap your final output strictly in valid JSON format containing exactly these keys:
```json
{
  "core_concept": "...",
  "key_vocabulary": [{"term": "...", "definition": "..."}],
  "why_this_matters": "...",
  "keywords": ["..."]
}
```
"""

TK_PROMPT = """Srenniw Digest Agent Logic Structure - Media Intake Phase

Your ONLY job is to take the Video Keywords provided in your context, search for an educational TikTok, and download it.

AFTER receiving the keywords, YOU MUST:
1. Search for a relevant educational TikTok using summarize_search_tiktok based on the visual keywords.
2. If a video is found, download it using summarize_download_tiktok.
3. Return the downloaded file path and the video metadata as your final response.

Output format MUST be strictly JSON:
```json
{
    "video_local_path": "...",
    "video_metadata": { "author": "...", "desc": "...", "likes": 0, "views": 0 }
}
```
"""

SUM_PROMPT = """Srenniw Digest Agent Logic Structure - Summarization Phase

Step 1: Take in the Material and Apply the Rules
INPUT: Raw classroom materials AND Deepdive agent insights provided in your context.
Global Constraints: * Keep it completely family-friendly (G-rated).
Do not invent any outside information (Strictly stick to the INPUT).

Step 3: The AI Thinking

Think 1 - Summarize Simplification:
Essence: Write a main simple summary which captures the lecture knowledge (INPUT), in plain language, easy for general people to understand (35-45 words). The very first sentence MUST be "Today class is" then state exactly what the topic is. No other warm-up phrases.
Example: Provide one real-world, everyday example of that concept (25-35 words). Do not start with "For example...". Jump straight into the scenario.

You MUST wrap your final output strictly in valid JSON format like this:
```json
{
  "essence": "...",
  "example": "..."
}
```
"""

# ── Tool sets per agent ───────────────────────────────────────────────────────
DD_TOOLS:  list[BaseTool] = []
TK_TOOLS:  list[BaseTool] = [summarize_search_tiktok, summarize_download_tiktok]
SUM_TOOLS: list[BaseTool] = [curricullm_generate, summarize_fetch_material_from_cloud]


# ── Shared Ollama model ───────────────────────────────────────────────────────
def make_model(tools: Optional[list] = None):
    llm = ChatOpenAI(
        model=_STRESS_TEST_MODEL,
        base_url="http://localhost:11434/v1",
        api_key="ollama",
        temperature=0.7,
    )
    return llm.bind_tools(tools) if tools else llm


# ── Minimal tool-calling agent loop ──────────────────────────────────────────
async def run_agent(
    system_prompt: str,
    user_message: str,
    tools: list,
    max_iterations: int = 6,
) -> tuple:
    """Simple ReAct loop: invoke LLM → execute tool_calls → repeat until done."""
    tool_map = {t.name: t for t in tools}
    llm = make_model(tools if tools else None)

    messages: list = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message),
    ]

    for _ in range(max_iterations):
        response: AIMessage = await llm.ainvoke(messages)
        messages.append(response)

        tool_calls = getattr(response, "tool_calls", []) or []
        if not tool_calls:
            return response.content, messages

        for tc in tool_calls:
            name    = tc["name"]
            args    = tc["args"]
            call_id = tc.get("id", name)
            t = tool_map.get(name)

            if t is None:
                result = f"[ERROR] Unknown tool: {name}"
            else:
                try:
                    # Handle both sync and async tools
                    import inspect
                    func = getattr(t, "func", None) or getattr(t, "_run", None)
                    if func and inspect.iscoroutinefunction(func):
                        result = await t.ainvoke(args)
                    else:
                        result = t.invoke(args)
                except Exception as exc:
                    result = f"[TOOL ERROR] {name}: {exc}"

            messages.append(
                ToolMessage(content=str(result), tool_call_id=call_id, name=name)
            )

    last_ai = next((m for m in reversed(messages) if isinstance(m, AIMessage)), None)
    return (last_ai.content if last_ai else "[no response after max iterations]"), messages


# ═════════════════════════════════════════════════════════════════════════════
# TEST CASES (parsed from testcase_duc.md)
# ═════════════════════════════════════════════════════════════════════════════

TEST_CASE_FILE = Path(__file__).parent.parent / "testcase_duc.md"


def _load_test_cases() -> list[dict]:
    raw = TEST_CASE_FILE.read_text(encoding="utf-8")
    parts = re.split(r"\s*={5,}\s*\n\s*TEST CASE (\d+)[^\n]+\n\s*={5,}", raw)
    labels = {
        "1": "Year 4 — Literacy, Numeracy & NAPLAN (Ms. Tremblay)",
        "2": "Year 8 — Science & Geography Integration (Mr. Okonkwo)",
        "3": "Year 11 — Biology & Economics ATAR (Mrs. Castellanos-Wright)",
    }
    cases, i = [], 1
    while i < len(parts) - 1:
        num  = parts[i].strip()
        body = parts[i + 1].strip()
        cases.append({"id": int(num), "label": labels.get(num, f"Case {num}"), "content": body})
        i += 2
    return cases


# ═════════════════════════════════════════════════════════════════════════════
# VALIDATION HELPERS (SummarizeRule.md)
# ═════════════════════════════════════════════════════════════════════════════

def _extract_json(text: str) -> Optional[dict]:
    m = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if m:
        try: return json.loads(m.group(1))
        except json.JSONDecodeError: pass
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try: return json.loads(m.group(0))
        except json.JSONDecodeError: pass
    return None


def _wc(s: str) -> int:
    return len(s.split())


def _trace(messages: list) -> str:
    parts = []
    for m in messages:
        parts.append(str(getattr(m, "content", "")))
        for tc in getattr(m, "tool_calls", []) or []:
            parts.append(tc.get("name", ""))
    return " ".join(parts)


def validate_deepdive(data: Optional[dict]) -> list:
    if data is None:
        return ["JSON extraction FAILED — no valid JSON block found in output"]
    issues = []
    for key in ("core_concept", "why_this_matters", "key_vocabulary", "keywords"):
        if key not in data:
            issues.append(f"Missing key: '{key}'")

    cc = data.get("core_concept", "")
    if cc:
        wc = _wc(cc)
        if not (40 <= wc <= 60):
            issues.append(f"core_concept word count {wc} (expected 40–60)")
        for p in ("the core concept is", "in this lesson", "today we"):
            if cc.lower().startswith(p):
                issues.append("core_concept starts with a forbidden intro phrase")

    vocab = data.get("key_vocabulary")
    if vocab is not None:
        if not isinstance(vocab, list):
            issues.append("key_vocabulary must be a list")
        elif not (2 <= len(vocab) <= 4):
            issues.append(f"key_vocabulary has {len(vocab)} terms (expected 2–4)")
        else:
            for entry in vocab:
                if not isinstance(entry, dict) or "term" not in entry or "definition" not in entry:
                    issues.append(f"key_vocabulary entry malformed: {entry}")
                    continue
                wc = _wc(entry["definition"])
                if not (15 <= wc <= 25):
                    issues.append(f"Vocab '{entry['term']}' definition word count {wc} (expected 15–25)")

    kws = data.get("keywords")
    if kws is not None:
        if not isinstance(kws, list):
            issues.append("keywords must be a list")
        elif not (1 <= len(kws) <= 2):
            issues.append(f"keywords has {len(kws)} items (expected 1–2)")
        else:
            visual_roots = {
                "visual", "animat", "experiment", "demonstrat", "reaction",
                "erupt", "collide", "liquefact", "melt", "flow", "motion",
                "dissolv", "form", "build", "unfold", "spread", "shift",
                "wave", "quake", "methylat", "express", "dissolving",
                "forming", "growing", "changing", "moving", "transform",
                "chang", "grow", "mov",
            }
            stop_words = {"the", "a", "an", "and", "of", "in", "is", "are"}
            for kw in kws:
                words = kw.lower().split()
                if len(words) < 2 or len(words) > 4:
                    issues.append(f"Keyword '{kw}' length {len(words)} words (expected 2–4)")
                has_visual = any(any(w.startswith(v) for v in visual_roots) for w in words)
                has_stop   = any(w in stop_words for w in words)
                if not has_visual:
                    issues.append(f"Keyword '{kw}' lacks a visual/motion word [WARN]")
                if has_stop:
                    issues.append(f"Keyword '{kw}' contains a stop-word")

    wtm = data.get("why_this_matters", "")
    if wtm:
        wc = _wc(wtm)
        if not (40 <= wc <= 60):
            issues.append(f"why_this_matters word count {wc} (expected 40–60)")
    return issues


def validate_tiktok(data: Optional[dict], trace: str) -> list:
    issues = []
    if "summarize_search_tiktok" not in trace:
        issues.append("summarize_search_tiktok tool NOT detected in agent trace")
    if "summarize_download_tiktok" not in trace:
        issues.append("summarize_download_tiktok tool NOT detected in agent trace")
    if data is None:
        issues.append("JSON extraction FAILED — no valid JSON block found in output")
        return issues
    if "video_local_path" not in data:
        issues.append("Missing key: 'video_local_path'")
    if "video_metadata" not in data:
        issues.append("Missing key: 'video_metadata'")
    else:
        for f in ("author", "desc", "likes", "views"):
            if f not in data["video_metadata"]:
                issues.append(f"video_metadata missing field: '{f}'")
    return issues


def validate_summarize(data: Optional[dict], trace: str) -> list:
    issues = []
    if "curricullm_generate" not in trace:
        issues.append("curricullm_generate tool NOT detected in agent trace")
    if data is None:
        issues.append("JSON extraction FAILED — no valid JSON block found in output")
        return issues
    for key in ("essence", "example"):
        if key not in data:
            issues.append(f"Missing key: '{key}'")
    if "essence" in data:
        wc = _wc(data["essence"])
        if not (35 <= wc <= 45):
            issues.append(f"essence word count {wc} (expected 35–45)")
        if not data["essence"].strip().lower().startswith("today class is"):
            issues.append(f"essence does not start with 'Today class is' — starts: '{data['essence'][:40]}'")
    if "example" in data:
        wc = _wc(data["example"])
        if not (25 <= wc <= 35):
            issues.append(f"example word count {wc} (expected 25–35)")
        if data["example"].strip().lower().startswith("for example"):
            issues.append("example starts with forbidden 'For example...' phrase")
    jargon = [
        "metacognitive","pedagogical","orthographic","geomorphological",
        "epigenetic","phenotypic plasticity","pigouvian","asthenosphere",
        "grapheme-phoneme","nominalisation",
    ]
    for j in jargon:
        for field in ("essence", "example"):
            if field in data and j in data[field].lower():
                issues.append(f"[DUMB-DOWN FAIL] Jargon '{j}' survived into '{field}'")
    return issues


# ═════════════════════════════════════════════════════════════════════════════
# PIPELINE RUNNER
# ═════════════════════════════════════════════════════════════════════════════

async def run_single_case(case: dict) -> dict:
    content = case["content"]
    report  = {"id": case["id"], "label": case["label"], "stages": {}}

    print(f"\n{'═'*70}")
    print(f"  RUNNING TEST CASE {case['id']}: {case['label']}")
    print(f"{'═'*70}")
    print(f"  [INPUT] {_wc(content)} words of raw teacher text")

    # ── STAGE 1: DeepDive ─────────────────────────────────────────────────────
    print(f"\n  [1/3] DeepDive Agent → extracting core concepts & keywords...")
    t0 = time.perf_counter()
    dd_json: Optional[dict] = None
    keywords: list[str] = []
    try:
        dd_raw, dd_msgs = await run_agent(DD_PROMPT, f"Process this teacher content:\n\n{content}", DD_TOOLS)
        dd_elapsed = time.perf_counter() - t0
        dd_json    = _extract_json(dd_raw)
        dd_issues  = validate_deepdive(dd_json)
        dd_status  = "PASS" if not dd_issues else "FAIL"
        keywords   = dd_json.get("keywords", []) if dd_json else []
        report["stages"]["deepdive"] = {
            "status": dd_status, "elapsed_s": round(dd_elapsed, 2),
            "issues": dd_issues, "output_json": dd_json, "raw_preview": dd_raw[:300],
        }
        print(f"  [1/3] DeepDive  → [{dd_status}]  ({dd_elapsed:.1f}s)")
        for iss in dd_issues: print(f"         ⚠  {iss}")
        if keywords: print(f"         Keywords extracted: {keywords}")
    except Exception as exc:
        report["stages"]["deepdive"] = {"status": "ERROR", "error": str(exc)}
        print(f"  [1/3] DeepDive  → [ERROR] {exc}")

    # ── STAGE 2: TikTokPull ──────────────────────────────────────────────────
    kw_str = ", ".join(keywords) if keywords else "educational science animation"
    print(f"\n  [2/3] TikTokPull Agent → keywords: {kw_str!r}")
    t0 = time.perf_counter()
    try:
        tk_raw, tk_msgs = await run_agent(TK_PROMPT, f"Search and download a TikTok for: {kw_str}", TK_TOOLS)
        tk_elapsed = time.perf_counter() - t0
        tk_trace   = _trace(tk_msgs)
        tk_json    = _extract_json(tk_raw)
        tk_issues  = validate_tiktok(tk_json, tk_trace)
        tk_status  = "PASS" if not tk_issues else "FAIL"
        report["stages"]["tiktokpull"] = {
            "status": tk_status, "elapsed_s": round(tk_elapsed, 2),
            "issues": tk_issues, "output_json": tk_json, "raw_preview": tk_raw[:300],
        }
        print(f"  [2/3] TikTokPull → [{tk_status}]  ({tk_elapsed:.1f}s)")
        for iss in tk_issues: print(f"         ⚠  {iss}")
    except Exception as exc:
        report["stages"]["tiktokpull"] = {"status": "ERROR", "error": str(exc)}
        print(f"  [2/3] TikTokPull → [ERROR] {exc}")

    # ── STAGE 3: Summarize ────────────────────────────────────────────────────
    dd_ctx     = json.dumps(dd_json or {}, indent=2)
    sum_prompt = (
        f"Here is the raw teacher content:\n{content}\n\n"
        f"Here is the Deepdive breakdown:\n{dd_ctx}\n\n"
        "Now write the plain-language Essence and Example for parents."
    )
    print(f"\n  [3/3] Summarize Agent → generating parent-friendly digest...")
    t0 = time.perf_counter()
    try:
        sum_raw, sum_msgs = await run_agent(SUM_PROMPT, sum_prompt, SUM_TOOLS)
        sum_elapsed = time.perf_counter() - t0
        sum_trace   = _trace(sum_msgs)
        sum_json    = _extract_json(sum_raw)
        sum_issues  = validate_summarize(sum_json, sum_trace)
        sum_status  = "PASS" if not sum_issues else "FAIL"
        report["stages"]["summarize"] = {
            "status": sum_status, "elapsed_s": round(sum_elapsed, 2),
            "issues": sum_issues, "output_json": sum_json, "raw_preview": sum_raw[:400],
        }
        print(f"  [3/3] Summarize  → [{sum_status}]  ({sum_elapsed:.1f}s)")
        for iss in sum_issues: print(f"         ⚠  {iss}")
    except Exception as exc:
        report["stages"]["summarize"] = {"status": "ERROR", "error": str(exc)}
        print(f"  [3/3] Summarize  → [ERROR] {exc}")

    all_statuses    = [s.get("status", "ERROR") for s in report["stages"].values()]
    report["overall"] = "PASS" if all(s == "PASS" for s in all_statuses) else "FAIL"
    return report


# ═════════════════════════════════════════════════════════════════════════════
# FINAL REPORT
# ═════════════════════════════════════════════════════════════════════════════

def print_final_report(reports: list[dict]):
    print("\n\n")
    print("╔" + "═"*68 + "╗")
    print("║" + "  SRENNIW DIGEST AGENT — STRESS TEST REPORT".center(68) + "║")
    print("║" + f"  {len(reports)} test cases × 3 agents = {len(reports)*3} total evaluations".center(68) + "║")
    print("╚" + "═"*68 + "╝")
    gp = gf = 0
    for r in reports:
        icon = "✅" if r["overall"] == "PASS" else "❌"
        print(f"\n{'─'*70}")
        print(f"  {icon}  TEST CASE {r['id']}: {r['label']}")
        print(f"{'─'*70}")
        for stage_name, stage in r["stages"].items():
            status  = stage.get("status", "ERROR")
            s_icon  = "✅" if status == "PASS" else ("⚠️ " if status == "FAIL" else "💥")
            elapsed = stage.get("elapsed_s", "?")
            print(f"\n  {s_icon} [{status}]  Stage: {stage_name.upper()}  ({elapsed}s)")
            for iss in stage.get("issues", []): print(f"       ↳ ISSUE: {iss}")
            if stage.get("error"):              print(f"       ↳ ERROR: {stage['error']}")
            out = stage.get("output_json")
            if out:
                print(f"\n       Final JSON output:")
                for line in json.dumps(out, indent=6, ensure_ascii=False).splitlines():
                    print(f"       {line}")
        if r["overall"] == "PASS": gp += 1
        else: gf += 1
    print(f"\n\n{'═'*70}")
    print(f"  GRAND TOTAL:  {gp} PASS  |  {gf} FAIL  (out of {len(reports)} cases)")
    print(f"{'═'*70}\n")


def print_architecture_note():
    print("""
╔══════════════════════════════════════════════════════════════════════╗
║           PIPELINE ARCHITECTURE ANALYSIS (pre-run)                  ║
╚══════════════════════════════════════════════════════════════════════╝

Model endpoint : Ollama @ http://localhost:11434  (mock CurricuLLM)
Model used     : llama3.2:3b  (minimax-m2.5:cloud requires cloud auth — unavailable locally)

AGENT CHAIN:
  [1] DeepDive    — no tools; pure LLM on raw teacher text.
                    Outputs: core_concept, key_vocabulary, why_this_matters, keywords.

  [2] TikTokPull  — 2 tools: summarize_search_tiktok, summarize_download_tiktok.
                    APIFY_API_TOKEN absent → mock TikTok data returned.

  [3] Summarize   — 2 tools: curricullm_generate, summarize_fetch_material_from_cloud.
                    Essence: 35–45 words, MUST start "Today class is".
                    Example: 25–35 words, MUST NOT start "For example".

VALIDATION (SummarizeRule.md): schema keys, word counts, dumb-down check, tool traces.
""")


# ═════════════════════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════════════════════

async def main():
    print_architecture_note()

    if not TEST_CASE_FILE.exists():
        print(f"[ERROR] testcase_duc.md not found at {TEST_CASE_FILE}")
        sys.exit(1)

    cases = _load_test_cases()
    if not cases:
        print("[ERROR] No test cases parsed — check header format in testcase_duc.md.")
        sys.exit(1)

    print(f"  Loaded {len(cases)} test cases\n")
    reports = [await run_single_case(c) for c in cases]
    print_final_report(reports)

    out_dir  = Path(__file__).parent.parent / "tests" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "stress_test_report.json"
    out_path.write_text(json.dumps(reports, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  Full JSON report saved → {out_path}\n")


if __name__ == "__main__":
    asyncio.run(main())
