# Change Report: Insights Dashboard — Child Development Analytics

**Date:** 2026-04-06  
**Branch:** main  
**Author:** AI-assisted implementation

---

## Overview

Built a comprehensive "Insights" dashboard that displays 6 sections of child development analytics. The system uses pure-Python analytical tools on the backend, exposed via a FastAPI REST endpoint, and a React/Next.js frontend with interactive components including animated flip cards and milestone pathway.

---

## Files Created / Modified

### Backend

| File | Action | Description |
|------|--------|-------------|
| `backend/agent/tools/insights/__init__.py` | **Created** | 6 LangChain `@tool` functions for analytics |
| `backend/agent/subagents/insights_agent.py` | **Created** | Insights subagent spec (ollama minimax-m2.5:cloud) |
| `backend/routers/insights.py` | **Created** | FastAPI endpoints `/api/parent/insights` and `/api/parent/insights/ai` |
| `backend/agent/run_insights_agent.py` | **Created** | Standalone test runner using ollama |
| `backend/main.py` | **Modified** | Registered `insights` router |

### Frontend

| File | Action | Description |
|------|--------|-------------|
| `src/app/parent/insights/page.tsx` | **Rewritten** | Full dashboard with 6 card sections |
| `src/components/insights/EmotionCard.tsx` | **Created** | Flip card: today emotion (front) + trend chart week/month/year (back) |
| `src/components/insights/MilestonePathway.tsx` | **Created** | Animated journey map with spring-motion marker |
| `src/components/insights/IntelligenceRadar.tsx` | **Created** | SVG radar spider chart with top-strength highlights |
| `src/components/insights/VARKCard.tsx` | **Created** | VARK progress bars with primary style badge |
| `src/components/insights/CareerPathCard.tsx` | **Created** | Holland RIASEC clusters grid with career groups |
| `src/components/insights/PersonalityCard.tsx` | **Created** | OCEAN trait bars + superpower badge |
| `src/hooks/useInsights.ts` | **Created** | Data hook: calls backend API, falls back to local computation |

---

## 6 Insight Sections

### 1. Multiple Intelligences (Gardner's 8)
**Input:** `entries.subject`, `entries.cognitiveLevel`, `entries.notes`  
**Algorithm:** Subject → intelligence weight mapping + NLP keyword detection in notes  
**Output:** `radar_data` (8 scores 0–100), `top_strengths`, `insight_message`  
**UI:** SVG spider/radar chart, top-2 strengths highlighted in green, score grid

### 2. VARK Learning Styles
**Input:** `entries.subject`, `entries.cognitiveLevel`, `entries.emotion`, `entries.notes`  
**Algorithm:** 2-step heuristic: NLP keyword matching (×2 weight) + subject/emotion context bonus (×3)  
**Output:** `vark_distribution` (4 percentages summing to 100), `primary_hint`, `multimodal_suggestion`  
**UI:** Horizontal progress bars, primary-style badge, suggestion card

### 3. Cognition Growth Velocity (Milestone Pathway)
**Input:** `entries.date`, `entries.cognitiveLevel`, `age`, `curriculum_benchmark`  
**Algorithm:** Compare avg Bloom level vs. curriculum benchmark (±0.5 threshold for status)  
**Output:** `status_badge` (Building Foundations / On Track / Exploring Ahead), `position_value` (0–2 scale), milestones  
**UI:** Animated horizontal track, spring-motion pin marker, insight + action card

### 4. Emotional Wellbeing (PERMA)
**Input:** `entries.date`, `entries.emotion`, `entries.cognitiveLevel`, `entries.notes`  
**Algorithm:** Emotion → score mapping, positivity ratio, Bước 3 alert detection (3+ anxious days, 5 disengaged streak)  
**Output:** `today`, `ratio_status`, `chart_data_week/month/year`, `alert`, `perma_scores`  
**UI:** 3D flip card (front=today emoji + status, back=line chart with emoji dots), week/month/year tabs

### 5. Personality Profile (OCEAN)
**Input:** `entries.emotion`, `entries.cognitiveLevel`, `entries.subject`, `entries.notes`, `app_usage_streak`  
**Algorithm:** Heuristic scoring for each Big Five trait; NLP keyword detection for Agreeableness and Extraversion  
**Output:** `traits` (5 Vietnamese-labeled scores), `superpower`, `insight`, `gentle_reminder`  
**UI:** Trait bars, gradient superpower badge, amber reminder card

### 6. Career Path (Holland RIASEC)
**Input:** Intelligence scores from Tool 1, subject averages  
**Algorithm:** RIASEC = weighted combination of intelligences; subject performance bonus; normalized to 0–100  
**Output:** `riasec_scores`, `holland_code` (3-letter), `top_clusters`, `cluster_groups`, `pathway_inspiration`  
**UI:** Top-3 cluster cards with bar, Holland code letter badges, inspiration card

---

## API Endpoints

### `POST /api/parent/insights`
Pure-Python computation (fast, no LLM needed).

**Request body:**
```json
{
  "entries": [
    { "date": "2026-03-10", "subject": "Maths", "cognitiveLevel": 3, "emotion": "Neutral", "notes": "..." }
  ],
  "child_age": 9,
  "curriculum_benchmark": 3.0,
  "app_usage_streak": 5
}
```

**Response:**
```json
{
  "intelligences": { "radar_data": {...}, "top_strengths": [...], "insight_message": "..." },
  "vark": { "vark_distribution": {...}, "primary_hint": "...", "multimodal_suggestion": "..." },
  "cognition": { "status_badge": "On Track", "position_value": 1.0, "milestones": [...], ... },
  "emotion": { "today": {...}, "ratio_status": "Flourishing", "chart_data_week": [...], ... },
  "personality": { "traits": {...}, "superpower": "...", "insight": "...", ... },
  "career": { "riasec_scores": {...}, "holland_code": "AIR", "top_clusters": [...], ... }
}
```

### `POST /api/parent/insights/ai`
Same input/output but enriched by `minimax-m2.5:cloud` via Ollama.  
Requires Ollama running on `localhost:11434`.

---

## Agent Details

**File:** `backend/agent/run_insights_agent.py`  
**Model:** `minimax-m2.5:cloud` via Ollama (`http://localhost:11434/v1`)  
**Default model in subagent:** `minimax-m2.5:cloud`  
**System prompt:** English (all prompts in English per project guidelines)

---

## Test Results

### Backend Tool Unit Tests (direct invocation)

```
=== Tool 1: Multiple Intelligences ===
radar_data: {'Logical': 63, 'Linguistic': 73, 'Spatial': 62, 'Kinesthetic': 68, 'Musical': 84, 'Interpersonal': 50, 'Intrapersonal': 43, 'Naturalist': 66}
top_strengths: ['Musical', 'Linguistic']
STATUS: PASSED ✓

=== Tool 2: VARK ===
vark_distribution: {'Visual': 31, 'Auditory': 12, 'Reading': 17, 'Kinesthetic': 40}
primary_hint: Kinesthetic
STATUS: PASSED ✓

=== Tool 3: Cognition Growth ===
status_badge: Exploring Ahead
position_value: 1.48
STATUS: PASSED ✓

=== Tool 4: PERMA Emotion ===
today: {'emotion': '🤔 Curious', 'score': 4, 'message': '...'}
ratio_status: Growing
chart_data_week count: 7
STATUS: PASSED ✓

=== Tool 5: OCEAN Personality ===
traits: {'Khám phá': 67, 'Kiên trì': 57, 'Năng lượng': 25, 'Thấu cảm': 49, 'Nhạy cảm': 19}
superpower: Nhà Khoa học Kiên định
STATUS: PASSED ✓

=== Tool 6: RIASEC Career ===
riasec_scores: {'Realistic': 95, 'Investigative': 75, 'Artistic': 100, ...}
holland_code: ARS
top_clusters: ['Artistic', 'Realistic']
STATUS: PASSED ✓
```

### API Endpoint Test

```
API keys: ['intelligences', 'vark', 'cognition', 'emotion', 'personality', 'career']
intelligences top_strengths: ['Musical', 'Naturalist']
vark primary_hint: Kinesthetic
cognition status_badge: Exploring Ahead
emotion ratio_status: Flourishing
personality superpower: Nhà Khoa học Kiên định
career holland_code: RAI
STATUS: PASSED ✓
```

### Frontend Build

```
pnpm build → exit 0
/parent/insights → Static, 0 TypeScript errors
```

---

## How to Run Backend Tests

### 1. Unit tests for the 6 tools (fast, no LLM needed)

```bash
cd backend
source venv/bin/activate

python -c "
import json, sys
sys.path.insert(0, '.')
from agent.tools.insights import (
    calculate_multiple_intelligences, analyze_vark_style,
    calculate_riasec_clusters, analyze_cognition_growth,
    analyze_perma_wellbeing, calculate_ocean_traits,
)

ENTRIES = json.dumps([
    {'date':'2026-03-10','subject':'Maths','cognitiveLevel':3,'emotion':'Neutral','notes':'Test'},
    {'date':'2026-03-11','subject':'English','cognitiveLevel':4,'emotion':'Curious','notes':'Books'},
    {'date':'2026-03-12','subject':'Science','cognitiveLevel':4,'emotion':'Excited','notes':'Animals'},
    {'date':'2026-03-13','subject':'PE','cognitiveLevel':5,'emotion':'Excited','notes':'Running'},
    {'date':'2026-03-14','subject':'Creative Arts','cognitiveLevel':4,'emotion':'Happy','notes':'Drawing'},
])

r1 = json.loads(calculate_multiple_intelligences.invoke({'entries_json': ENTRIES}))
r2 = json.loads(analyze_vark_style.invoke({'entries_json': ENTRIES}))
r3 = json.loads(analyze_cognition_growth.invoke({'entries_json': ENTRIES, 'age': 9, 'curriculum_benchmark': 3.0}))
r4 = json.loads(analyze_perma_wellbeing.invoke({'entries_json': ENTRIES}))
r5 = json.loads(calculate_ocean_traits.invoke({'entries_json': ENTRIES, 'app_usage_streak': 5}))
r6 = json.loads(calculate_riasec_clusters.invoke({
    'intelligence_scores_json': json.dumps(r1['radar_data']),
    'subject_strengths_json': json.dumps({'Maths':3,'English':4,'Science':4,'PE':5,'Creative Arts':4}),
}))
print('ALL TOOLS OK:', [r1['top_strengths'], r2['primary_hint'], r3['status_badge'], r4['ratio_status'], r5['superpower'], r6['holland_code']])
"
```

### 2. API endpoint test (requires FastAPI server running)

```bash
# Terminal 1: start server
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: call API
curl -X POST http://localhost:8000/api/parent/insights \
  -H "Content-Type: application/json" \
  -d '{
    "entries": [
      {"date":"2026-03-10","subject":"Maths","cognitiveLevel":3,"emotion":"Neutral","notes":"Test"},
      {"date":"2026-03-11","subject":"English","cognitiveLevel":4,"emotion":"Curious","notes":"Books"},
      {"date":"2026-03-12","subject":"PE","cognitiveLevel":5,"emotion":"Excited","notes":"Sports"}
    ],
    "child_age": 9,
    "curriculum_benchmark": 3.0,
    "app_usage_streak": 5
  }' | python3 -m json.tool
```

### 3. Agent test with Ollama (LLM-enhanced, requires Ollama)

```bash
# Ensure Ollama is running and model is pulled:
# ollama pull minimax-m2.5:cloud

cd backend
source venv/bin/activate
python -m agent.run_insights_agent
```

### 4. Frontend dev server

```bash
cd /path/to/srenniw_edx   # root of project
pnpm dev
# Open http://localhost:3000/parent/insights
# Add journal entries first (Journal tab) to see the dashboard
```

---

## Frontend Architecture

```
src/
├── app/parent/insights/page.tsx          ← Main dashboard page (rewritten)
├── components/insights/
│   ├── EmotionCard.tsx                   ← Flip card + week/month/year chart
│   ├── MilestonePathway.tsx              ← Animated journey map
│   ├── IntelligenceRadar.tsx             ← SVG radar chart
│   ├── VARKCard.tsx                      ← VARK progress bars
│   ├── CareerPathCard.tsx                ← RIASEC cluster cards
│   └── PersonalityCard.tsx               ← OCEAN bars + superpower
└── hooks/useInsights.ts                  ← Data hook (API + local fallback)
```

**Data flow:**
1. `useJournalEntries()` reads localStorage journal entries
2. `useInsights(entries)` first computes locally (instant), then fetches `/api/parent/insights`
3. API data replaces local data when backend is available; silent fallback on failure
4. All 6 card components receive typed props and render independently

---

## Notes

- **Default LLM model:** `minimax-m2.5:cloud` via Ollama (`http://localhost:11434/v1`)
- **Auth:** `/api/parent/insights` does not require Clerk auth token (can be added by uncommenting `require_parent` in router)
- **All system prompts:** Written in English
- **UI language:** Mixed EN/VN (insight messages in Vietnamese for parents)
- **framer-motion** was added as a new dependency (`pnpm add framer-motion`)
