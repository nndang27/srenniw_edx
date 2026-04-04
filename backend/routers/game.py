from fastapi import APIRouter, Depends
from auth import require_parent
from agent.pipeline import generate_game_code
from pydantic import BaseModel

router = APIRouter(prefix="/api/game", tags=["game"])

class GameRequest(BaseModel):
    concept: str
    year_level: str
    subject: str
    game_type: str = "drag_and_drop"
    language: str = "en"

@router.post("/generate")
async def generate_game(body: GameRequest):
    code = await generate_game_code(body.concept, body.year_level,
                                     body.subject, body.game_type, body.language)
    return {"code": code, "game_type": body.game_type}
