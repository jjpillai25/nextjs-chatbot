from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AttachmentMetadata(BaseModel):
    name: str
    type: str

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    user_id: int
    message: str
    attachment: Optional[AttachmentMetadata] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: int

class ChatMessageCreate(BaseModel):
    conversation_id: int
    role: str  
    context: str

class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    context: str
    timestamp: datetime

    class Config:
        from_attributes = True