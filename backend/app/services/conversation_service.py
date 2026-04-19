from sqlalchemy.orm import Session
from app.models.conversation_model import Conversation
from app.core.retry import retry_on_connection_error

def generate_title(first_message: str, attachment_name: str = None) -> str:
    # If attachment name is provided, use it as the title
    if attachment_name:
        return attachment_name[:50] + "..." if len(attachment_name) > 50 else attachment_name
    # Otherwise, use the first message
    return first_message[:50] + "..." if len(first_message) > 50 else first_message

@retry_on_connection_error
def create_conversation(db: Session, user_id: int, first_message: str, attachment_name: str = None) -> Conversation:
    title = generate_title(first_message, attachment_name)
    conversation = Conversation(user_id=user_id, title=title)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

@retry_on_connection_error
def get_all_conversations(db: Session, user_id: int) -> list[Conversation]:
    return db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()).all()

@retry_on_connection_error
def delete_conversation(db: Session, conversation_id: int, user_id: int) -> bool:
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()
    if not conversation:
        return False
    db.delete(conversation)
    db.commit()
    return True