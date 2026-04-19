from fastapi import APIRouter, HTTPException
from app.schemas.user_schema import SignUpRequest, UserResponse, LoginRequest
from app.services.user_service import create_user, verify_password, create_access_token
from app.models.user_model import User
from app.core.db import SessionLocal

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/signup", response_model=UserResponse)
def sign_up(request: SignUpRequest):
    new_user = create_user(request.email, request.password)

    if not new_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    return new_user

@router.post("/login")
def login(request: LoginRequest):
    db = SessionLocal()
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"user_id": user.id})

    return {"access_token": token, "token_type": "bearer", "user_id": user.id}
