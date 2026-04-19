from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.chat_schema import ChatRequest, ChatResponse, ChatMessageResponse
from app.services.llm_service import reset_messages
from app.services.chat_service import handle_chat, get_conversation_messages

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        conversation_id, answer = handle_chat(db, request.conversation_id, request.user_id, request.message)
        return ChatResponse(response=answer, conversation_id=conversation_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
async def reset(request: ChatRequest):
    try:
        reset_messages(request.user_id)
        return {"message": "Chat history reset successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/{conversation_id}", response_model=list[ChatMessageResponse])
async def get_messages(conversation_id: int, user_id: int, db: Session = Depends(get_db)):
    try:
        messages = get_conversation_messages(db, conversation_id, user_id)
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))