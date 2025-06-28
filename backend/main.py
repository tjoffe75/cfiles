from fastapi import FastAPI
from contextlib import asynccontextmanager
from config_endpoints import router as config_router, manager
from database import models
from database.database import engine
import time
import logging
import pika
import threading
import json
import os
import asyncio
import aio_pika
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

async def listen_to_status_updates(manager):
    """Listens for status updates from RabbitMQ and broadcasts them asynchronously."""
    rabbitmq_user = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
    rabbitmq_pass = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
    
    for attempt in range(MAX_RETRIES):
        try:
            connection = await aio_pika.connect_robust(
                f"amqp://{rabbitmq_user}:{rabbitmq_pass}@rabbitmq/"
            )
            logger.info("Successfully connected to RabbitMQ for status updates.")
            break
        except Exception as e:
            logger.warning(f"RabbitMQ connection attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY)
            else:
                logger.error("Could not connect to RabbitMQ for status updates after all retries.")
                return

    async with connection:
        channel = await connection.channel()
        queue = await channel.declare_queue('status_updates', durable=True)

        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    logger.info(f"Received status update: {message.body}")
                    try:
                        message_data = json.loads(message.body)
                        await manager.broadcast(json.dumps(message_data))
                    except Exception as e:
                        logger.error(f"Error processing status update: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    logger.info("Application startup...")
    connect_to_db_with_retry()
    # Start the RabbitMQ listener as a background task
    app.state.rabbitmq_listener_task = asyncio.create_task(listen_to_status_updates(manager))
    yield
    # Code to run on shutdown
    logger.info("Application shutdown.")
    app.state.rabbitmq_listener_task.cancel()
    try:
        await app.state.rabbitmq_listener_task
    except asyncio.CancelledError:
        logger.info("RabbitMQ listener task cancelled.")

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
