from sqlalchemy.orm import Session
from app.models.chat_model import Chat
from app.models.conversation_model import Conversation
from app.services.llm_service import get_llmMessages
from app.core.retry import retry_on_connection_error

@retry_on_connection_error
def handle_chat(db: Session, conversation_id: int, user_id: int, user_message: str)  :
    if not conversation_id:
        new_conversation = Conversation(user_id=user_id, title=user_message[:30])
        db.add(new_conversation)
        db.commit()
        db.refresh(new_conversation)

        conversation_id = new_conversation.id

    user_message = Chat(conversation_id=conversation_id, role="user", context=user_message)
    db.add(user_message)

    answer = get_llmMessages(user_id, user_message.context)    
    bot_message = Chat(conversation_id=conversation_id, role="bot", context=answer)
    db.add(bot_message)

    db.commit()
    return conversation_id, answer


'''
def handle_chat(db: Session, conversation_id: int, user_id: int, user_message: str) -> str:
    from app.models.conversation_model import Conversation
    # Verify conversation belongs to user
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()
    if not conversation:
        raise ValueError("Conversation not found or does not belong to user")
    
    # Save user message to database
    user_chat = Chat(conversation_id=conversation_id, role="user", context=user_message)
    db.add(user_chat)
    db.commit()
    db.refresh(user_chat)

    # Get response from LLM
    bot_response = get_llmMessages(user_id, user_message)

    # Save bot response to database
    bot_chat = Chat(conversation_id=conversation_id, role="bot", context=bot_response)
    db.add(bot_chat)
    db.commit()
    db.refresh(bot_chat)

    return bot_response
'''

@retry_on_connection_error
def get_conversation_messages(db: Session, conversation_id: int, user_id: int) -> list[Chat]:
    from app.models.conversation_model import Conversation
    # Verify conversation belongs to user
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()
    if not conversation:
        return []
    return db.query(Chat).filter(Chat.conversation_id == conversation_id).order_by(Chat.timestamp.asc()).all()