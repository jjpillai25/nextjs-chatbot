from sqlalchemy.orm import Session
from app.models.user_model import User
from app.core.db import SessionLocal
from app.core.retry import retry_on_connection_error
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    import json
    from datetime import datetime
    # Simple token creation - in production, use JWT
    token_data = {**data, "iat": datetime.utcnow().isoformat()}
    return json.dumps(token_data)

@retry_on_connection_error
def create_user(email: str, password: str) -> User:
    db: Session = SessionLocal()

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        db.close()
        return None # User already exists
    
    # Extract username from email (part before @)
    username = email.split("@")[0]
    hashed_password = hash_password(password)

    new_user = User(username=username, email=email, password_hash=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()

    return new_user