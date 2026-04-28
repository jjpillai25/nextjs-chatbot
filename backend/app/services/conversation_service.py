from sqlalchemy.orm import Session
from app.models.conversation_model import Conversation
from app.core.retry import retry_on_connection_error

def extract_main_idea(message: str) -> str:
    """Extract the main idea from a message, limited to 4 words max."""
    # Remove extra whitespace and get first line if multi-line
    message = message.strip().split('\n')[0]
    
    # Common filler words to skip
    filler_words = {'and', 'or', 'the', 'a', 'an', 'to', 'is', 'in', 'on', 'at', 'by', 'for', 'of', 'with', 'i', 'me', 'my', 'you', 'your', 'we', 'our', 'it', 'its', 'this', 'that', 'these', 'those', 'can', 'could', 'would', 'should', 'do', 'does', 'did', 'be', 'been', 'being', 'have', 'has', 'had'}
    
    # Split into words and filter out filler words
    words = message.lower().split()
    meaningful_words = [word for word in words if word not in filler_words and len(word) > 1]
    
    # Take first 4 meaningful words and capitalize
    title_words = meaningful_words[:4]
    if not title_words:
        # If no meaningful words found, just take first 4 words
        title_words = words[:4]
    
    title = " ".join(title_words).title()
    return title[:50] if title else "Chat"

def generate_title(first_message: str, attachment_name: str = None) -> str:
    # If attachment name is provided, use it as the title
    if attachment_name:
        return attachment_name[:50] + "..." if len(attachment_name) > 50 else attachment_name
    # Otherwise, extract main idea from the first message
    return extract_main_idea(first_message)

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

@retry_on_connection_error
def rename_conversation(db: Session, conversation_id: int, user_id: int, new_title: str) -> Conversation:
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()
    if not conversation:
        return None
    conversation.title = new_title
    db.commit()
    db.refresh(conversation)
    return conversation