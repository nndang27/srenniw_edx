from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID

class ClassCreate(BaseModel):
    name: str
    year_level: str
    subject: str

class ComposeInput(BaseModel):
    class_id: UUID
    content_type: Literal["assignment", "comment", "weekly_update"]
    raw_input: str
    subject: str
    year_level: str

class FeedbackCreate(BaseModel):
    brief_id: UUID
    message: str

class ProfileUpdate(BaseModel):
    preferred_language: Literal["en", "vi", "zh", "ar"]

class ChatMessage(BaseModel):
    type: Literal["message", "typing"]
    content: Optional[str] = None

class ChatbotMessage(BaseModel):
    type: Literal["message"]
    content: str
    brief_id: Optional[str] = None
