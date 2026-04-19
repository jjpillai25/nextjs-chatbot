from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os
import time
from app.core.retry import RETRYABLE_ERRORS
import logging

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine with connection pool settings for better retry behavior
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Test connections before using them
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Get a database session with automatic retry logic.
    
    This generator yields a database session and ensures it's properly closed.
    If the connection fails, it will retry up to 3 times with exponential backoff.
    """
    max_retries = 3
    initial_delay = 0.5
    backoff_factor = 2.0
    delay = initial_delay
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            db = SessionLocal()
            # Test the connection
            db.execute(text("SELECT 1"))
            logger.debug(f"Database session created successfully (attempt {attempt + 1})")
            try:
                yield db
            finally:
                db.close()
            return
        except RETRYABLE_ERRORS as e:
            last_exception = e
            if attempt < max_retries:
                logger.warning(
                    f"Failed to create database session (attempt {attempt + 1}/{max_retries + 1}): "
                    f"{str(e)}. Retrying in {delay:.1f} seconds..."
                )
                time.sleep(delay)
                delay *= backoff_factor
            else:
                logger.error(
                    f"Failed to create database session after {max_retries + 1} attempts: {str(e)}"
                )
    
    if last_exception:
        raise last_exception