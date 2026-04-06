from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import teacher, parent, chat, chatbot, insights

app = FastAPI(title="Srenniw API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teacher.router)
app.include_router(parent.router)
app.include_router(chat.router)
app.include_router(chatbot.router)

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

from routers import game
app.include_router(game.router)
app.include_router(insights.router)

# Trigger tool registration at startup
import agent.tools.curricullm_tools
import agent.tools.supabase_tools
import agent.tools.summarize
import agent.tools.diary
import agent.tools.suggestion
import agent.tools.game
