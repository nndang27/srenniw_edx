from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import teacher, parent, chat, chatbot

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
