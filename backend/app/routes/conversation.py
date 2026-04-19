from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.conversation_schema import ConversationCreate, ConversationDelete, ConversationResponse
from app.services.conversation_service import create_conversation, get_all_conversations, delete_conversation

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.post("/", response_model=ConversationResponse)
def new_conversation(request: ConversationCreate, db: Session = Depends(get_db)):
    try:
        conversation = create_conversation(db, request.user_id, request.first_message, request.attachment_name)
        return conversation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}", response_model=list[ConversationResponse])
def get_conversations(user_id: int, db: Session = Depends(get_db)):
    try:
        conversations = get_all_conversations(db, user_id)
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{conversation_id}")
def remove_conversation(conversation_id: int, request: ConversationDelete, db: Session = Depends(get_db)):
    try:
        success = delete_conversation(db, conversation_id, request.user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"message": "Conversation deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))