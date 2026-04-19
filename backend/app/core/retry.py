import time
import functools
from typing import Callable, Any, TypeVar, ParamSpec
from sqlalchemy.exc import OperationalError, DBAPIError, DisconnectionError
import logging

logger = logging.getLogger(__name__)

P = ParamSpec("P")
R = TypeVar("R")

# Database errors that should trigger a retry
RETRYABLE_ERRORS = (
    OperationalError,
    DBAPIError,
    DisconnectionError,
    ConnectionError,
    TimeoutError,
)


def with_retry(
    max_retries: int = 3,
    initial_delay: float = 0.5,
    backoff_factor: float = 2.0,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """
    Decorator to add automatic retry logic to database operations.
    
    Retries the decorated function if a database connection error occurs.
    Uses exponential backoff between retries.
    
    Args:
        max_retries: Maximum number of retry attempts (default: 3)
        initial_delay: Initial delay between retries in seconds (default: 0.5)
        backoff_factor: Multiplier for delay on each retry (default: 2.0)
    
    Returns:
        Decorated function with retry logic
    
    Raises:
        The last exception if all retries are exhausted
    
    Example:
        @with_retry(max_retries=3)
        def get_user(db: Session, user_id: int):
            return db.query(User).filter(User.id == user_id).first()
    """
    
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            last_exception: Exception | None = None
            delay = initial_delay
            
            for attempt in range(max_retries + 1):
                try:
                    logger.debug(
                        f"Executing {func.__name__} (attempt {attempt + 1}/{max_retries + 1})"
                    )
                    return func(*args, **kwargs)
                except RETRYABLE_ERRORS as e:
                    last_exception = e
                    
                    if attempt < max_retries:
                        logger.warning(
                            f"Database connection error in {func.__name__} "
                            f"(attempt {attempt + 1}/{max_retries + 1}): {str(e)}. "
                            f"Retrying in {delay:.1f} seconds..."
                        )
                        time.sleep(delay)
                        delay *= backoff_factor
                    else:
                        logger.error(
                            f"Database operation {func.__name__} failed after "
                            f"{max_retries + 1} attempts: {str(e)}"
                        )
                except Exception as e:
                    # Non-retryable exceptions should be raised immediately
                    logger.error(
                        f"Non-retryable error in {func.__name__}: {str(e)}"
                    )
                    raise
            
            # If we've exhausted all retries, raise the last exception
            if last_exception:
                raise last_exception
        
        return wrapper
    
    return decorator


def retry_on_connection_error(func: Callable[P, R]) -> Callable[P, R]:
    """
    Simplified decorator with default retry settings (3 retries).
    
    Use this when you want basic retry logic without customization.
    
    Example:
        @retry_on_connection_error
        def create_user(db: Session, email: str):
            user = User(email=email)
            db.add(user)
            db.commit()
            return user
    """
    return with_retry(max_retries=3, initial_delay=0.5, backoff_factor=2.0)(func)


def execute_with_retry(
    operation: Callable[..., R],
    *args: Any,
    max_retries: int = 3,
    **kwargs: Any,
) -> R:
    """
    Execute a database operation with automatic retry logic.
    
    Use this function to wrap ad-hoc database operations without using a decorator.
    
    Args:
        operation: The function to execute
        *args: Positional arguments to pass to the operation
        max_retries: Maximum number of retries (default: 3)
        **kwargs: Keyword arguments to pass to the operation
    
    Returns:
        The result of the operation
    
    Example:
        result = execute_with_retry(
            db.query(User).filter(User.id == user_id).first,
            max_retries=3
        )
    """
    initial_delay = 0.5
    backoff_factor = 2.0
    last_exception: Exception | None = None
    delay = initial_delay
    
    for attempt in range(max_retries + 1):
        try:
            logger.debug(
                f"Executing operation (attempt {attempt + 1}/{max_retries + 1})"
            )
            return operation(*args, **kwargs)
        except RETRYABLE_ERRORS as e:
            last_exception = e
            
            if attempt < max_retries:
                logger.warning(
                    f"Database connection error (attempt {attempt + 1}/{max_retries + 1}): "
                    f"{str(e)}. Retrying in {delay:.1f} seconds..."
                )
                time.sleep(delay)
                delay *= backoff_factor
            else:
                logger.error(
                    f"Database operation failed after {max_retries + 1} attempts: {str(e)}"
                )
        except Exception as e:
            logger.error(f"Non-retryable error: {str(e)}")
            raise
    
    if last_exception:
        raise last_exception
