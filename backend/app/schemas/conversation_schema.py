from pydantic import BaseModel
from datetime import datetime

class ConversationCreate(BaseModel):
    user_id: int
    first_message: str
    attachment_name: str = None


class ConversationDelete(BaseModel):
    user_id: int


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True