from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.core.db import Base, engine
from app.routes.chat import router as chat_router
from app.routes.user import router as user_router
from app.routes import conversation
from app.models import user_model, conversation_model, chat_model
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """
    Custom handler to return detailed validation error messages
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type"),
            "input": error.get("input")
        })
    
    logger.error(f"Validation error on {request.url.path}: {errors}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Request validation failed",
            "errors": errors
        },
    )

# Register routers
app.include_router(chat_router)
app.include_router(user_router)
app.include_router(conversation.router)

# Create all tables
Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    """
    Health check endpoint that verifies server and database status.
    
    Returns:
        dict: Status of server and database connection
    """
    db_status = "down"
    db_error = None
    
    try:
        # Try to establish a connection and execute a simple query
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            db_status = "up"
    except Exception as e:
        db_error = str(e)
    
    return {
        "status": "healthy" if db_status == "up" else "unhealthy",
        "server": "up",
        "database": db_status,
        "database_error": db_error if db_error else None
    }