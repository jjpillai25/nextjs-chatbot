from sqlalchemy.orm import Session
from app.models.conversation_model import Conversation
from app.core.retry import retry_on_connection_error
from app.services.llm_service import client

def extract_main_idea(message: str) -> str:
    """Extract the main idea from a message using LLM, limited to 4 words max."""
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": "You are a title generator. Extract the main idea from the given message in 4 words or less. Reply with ONLY the title, nothing else."
                },
                {"role": "user", "content": message}
            ],
            temperature=0.3,
            max_tokens=20,
        )
        title = response.choices[0].message.content.strip()
        # Ensure it doesn't exceed reasonable length
        return title[:50] if title else "Chat"
    except Exception as e:
        # Fallback if LLM call fails
        print(f"Error extracting title: {e}")
        words = message.split()[:4]
        return " ".join(words) if words else "Chat"

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