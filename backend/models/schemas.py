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

class DiaryNoteUpdate(BaseModel):
    date: str
    subject: str
    parent_note: Optional[str] = None
    cognitive_level: Optional[int] = None
    emotion: Optional[str] = None
    time_spent: Optional[int] = None

class LectureBlockCreate(BaseModel):
    title: str
    subject: str
    content: Optional[str] = ""

class LectureBlockUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    week_id: Optional[str] = None
    day_of_week: Optional[int] = None
    sort_order: Optional[int] = None

class LectureBlockSync(BaseModel):
    id: str
    title: str
    subject: str
    content: Optional[str] = ""
    week_id: Optional[str] = None
    day_of_week: Optional[int] = None
    sort_order: Optional[int] = 0

class LectureBlockSave(BaseModel):
    blocks: list[LectureBlockSync]

class TopicAiGenerateInput(BaseModel):
    subject: str
    topic: str
    learningGoal: str
    class_work: Optional[str] = ""

class TopicAiRegenerateInput(BaseModel):
    section: str
    subject: str
    topic: str
    class_work: str = ""
    previous_ai_response: str
    user_requirement: str

class TopicPublish(BaseModel):
    week_id: str
    subject: str
    topic: str
    summary: dict | str | None = None
    deepDive: dict | str | None = None
    tiktoks: list | None = None
    class_work: str | None = None

class TiktokRes(BaseModel):
    title: str
    creator: str
    views: str

class TopicAiGenerateResult(BaseModel):
    summary: str
    deepDive: str
    tiktoks: list[TiktokRes]
