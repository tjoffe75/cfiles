from fastapi import FastAPI
from contextlib import asynccontextmanager
from config_endpoints import router as config_router
from database import models
from database.database import engine
import time
import logging
from sqlalchemy.exc import OperationalError
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_RETRIES = 10
RETRY_DELAY = 5

def connect_to_db_with_retry():
    """Tries to connect to the database with retries."""
    for attempt in range(MAX_RETRIES):
        try:
            # The create_all function will try to connect to the database.
            models.Base.metadata.create_all(bind=engine)
            logger.info("Successfully connected to the database and created tables.")
            return
        except OperationalError as e:
            logger.warning(f"Database connection attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                logger.error("Could not connect to the database after all retries. The application will not start correctly.")
                raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    logger.info("Application startup...")
    connect_to_db_with_retry()
    yield
    # Code to run on shutdown
    logger.info("Application shutdown.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows the React app to connect
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(config_router)

@app.get("/")
def root():
    return {"message": "Backend is running"}
