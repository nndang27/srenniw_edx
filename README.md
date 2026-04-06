# LearnBridge Hackathon Instructions

## Setting up the Repository Locally

To start working on the project on your local machine, first clone the repository:

```bash
# Clone the repository
git clone https://github.com/nndang27/srenniw_edx.git

# Navigate into the project directory
cd srenniw_edx
```

### Installation & Running the Servers

**Frontend (Next.js):**
```bash
cd src
pnpm install
pnpm dev
```

**Backend (FastAPI):**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Where to Add / Modify Code

To maintain a clean and modular architecture for the hackathon, follow this guide for your contributions:

### 1. Frontend / User Interface (UI)
All frontend development occurs inside the `frontend/` directory using Next.js (App Router), TypeScript, and Tailwind CSS.
- **Pages & Routes**: Modify or add to `frontend/src/app/`. Use `frontend/src/app/teacher/` for teacher views and `frontend/src/app/parent/` for parent views.
- **Components**: Add visual components such as buttons, specific layout widgets, or forms to `frontend/src/components/`. Use the `teacher/`, `parent/`, or `shared/` subdirectories as applicable.
- **Theme & Styles**: All utility styles are driven by Tailwind CSS; global styling overrides live in `frontend/src/app/globals.css`.

### 2. Backend & API Logic
The backend runs on Python/FastAPI and connects to Supabase and Clerk. It lives within the `backend/` folder.
- **API Endpoints (Routers)**: Add new features as endpoints in `backend/routers/` (e.g., `game.py`, `student.py`). Update `backend/main.py` if you introduce a brand new router file so it's registered on start up.
- **Database Connectors**: Database interaction using the Supabase client goes in `backend/db/`.
- **Data Models**: Use Pydantic classes inside `backend/models/schemas.py` for API input/output validation.

### 3. DeepAgents AI Agent Integration
The core AI orchestration, subagents, and tools are isolated inside the `backend/agent/` module. The core architecture uses the DeepAgents library (located in `backend/agent/core/` — do not modify the `core/` folder).

Here is how each team member should integrate their specific features:
- **Writing Application Tools**: You will spend most of your time writing discrete, single-purpose Python classes implementing `BaseTool`. Add your code to the appropriate category folder:
  - Summarize Feature: `backend/agent/tools/summarize/`
  - Diary Feature: `backend/agent/tools/diary/`
  - Suggestion Feature: `backend/agent/tools/suggestion/`
  - Game Feature: `backend/agent/tools/game/`
  *(Crucial: once a tool is created in one of these locations, ensure you import it in the corresponding `__init__.py` file within that folder so the system registers it at startup).*
- **Modifying Sub-Agent Prompts**: You can adjust the personalities, system prompts, and behavior triggers for the 4 AI personalities. Update the respective wrapper file located in `backend/agent/subagents/` (e.g. `diary_agent.py`).
- **Skills Markdown Documentation**: Define instructions, use cases, and behavior constraints for your agent in markdown using `backend/agent/skills/{feature}/SKILL.md`.

---
Happy Hacking!
