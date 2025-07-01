from fastapi import FastAPI
from contextlib import asynccontextmanager
from config_endpoints import router as config_router, status_manager
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
from fastapi import Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database.database import SessionLocal
from typing import List
from datetime import datetime, timedelta
import schemas

# Skapa nödvändiga mappar automatiskt
for folder in ["uploads", "quarantine", "testfiles"]:
    os.makedirs(folder, exist_ok=True)

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

def init_system_settings():
    """
    Initierar alla nödvändiga systeminställningar i databasen om de saknas.
    Lägg till nya inställningar i denna lista för att göra systemet modulärt.
    """
    from sqlalchemy.exc import IntegrityError
    from database.database import SessionLocal
    from database import models
    settings_defaults = [
        {"key": "RBAC_SSO_ENABLED", "value": "false", "description": "Enable SSO/RBAC (true/false)"},
        {"key": "AD_ENDPOINT", "value": "", "description": "AD/SSO endpoint (OpenID Connect)"},
        {"key": "AD_CLIENT_ID", "value": "", "description": "AD/SSO client id"},
        {"key": "AD_CLIENT_SECRET", "value": "", "description": "AD/SSO client secret"},
        {"key": "AD_GROUP_USERS", "value": "users", "description": "AD group for normal users"},
        {"key": "AD_GROUP_ADMINS", "value": "admins", "description": "AD group for admins"},
        # Lägg till fler nycklar här vid behov
    ]
    db = SessionLocal()
    created = []
    try:
        for d in settings_defaults:
            if not db.query(models.SystemSetting).filter_by(key=d["key"]).first():
                s = models.SystemSetting(**d)
                db.add(s)
                created.append(d["key"])
        db.commit()
    except IntegrityError:
        db.rollback()
    finally:
        db.close()
    if created:
        logger.info(f"Följande systeminställningar skapades vid startup: {created}")

async def listen_to_status_updates(ws_manager):
    """Listens for status updates from RabbitMQ and broadcasts them asynchronously."""
    rabbitmq_user = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
    rabbitmq_pass = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
    amqp_url = f"amqp://{rabbitmq_user}:{rabbitmq_pass}@rabbitmq/"

    while True:  # Self-healing loop
        try:
            logger.info("Connecting to RabbitMQ...")
            connection = await aio_pika.connect_robust(amqp_url)
            logger.info("Successfully connected to RabbitMQ.")

            async with connection:
                channel = await connection.channel()
                queue = await channel.declare_queue('status_updates', durable=True)
                logger.info("RabbitMQ listener is waiting for status updates.")

                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        async with message.process():
                            body = message.body.decode()
                            logger.info(f"Received status update: {body}")
                            try:
                                await ws_manager.broadcast(body)
                                logger.info(f"Broadcasted update to {len(status_manager.active_connections)} clients.")
                            except Exception as e:
                                logger.error(f"Error broadcasting message: {e}")
        
        except asyncio.CancelledError:
            logger.info("RabbitMQ listener task cancelled.")
            break
        except Exception as e:
            logger.error(f"RabbitMQ listener crashed: {e}. Reconnecting in {RETRY_DELAY} seconds...")
            await asyncio.sleep(RETRY_DELAY)

async def start_ping_pong_service(ws_manager):
    """Periodically sends pings to clients and disconnects unresponsive ones."""
    PING_INTERVAL = 20  # seconds
    PONG_TIMEOUT = 45   # seconds

    while True:
        try:
            await asyncio.sleep(PING_INTERVAL)

            connections_to_ping = list(ws_manager.active_connections.keys())
            if not connections_to_ping:
                continue # No need to do anything if no one is connected

            logger.info(f"Pinging {len(connections_to_ping)} clients to keep connections alive.")
            ping_message = json.dumps({"type": "ping"})
            
            # Send ping to all connected clients
            for websocket in connections_to_ping:
                try:
                    await websocket.send_text(ping_message)
                except Exception:
                    # If sending fails, the connection is likely dead, disconnect it
                    ws_manager.disconnect(websocket)

            # Check for clients that have not responded in time
            now = datetime.utcnow()
            # Iterate over a copy of the items
            for websocket, last_pong_time in list(ws_manager.active_connections.items()):
                if (now - last_pong_time) > timedelta(seconds=PONG_TIMEOUT):
                    logger.warning(f"Client {websocket.client} timed out. Disconnecting.")
                    try:
                        await websocket.close(code=1000)
                    finally:
                        ws_manager.disconnect(websocket)

        except asyncio.CancelledError:
            logger.info("Ping-Pong service cancelled.")
            break
        except Exception as e:
            logger.error(f"An error occurred in the Ping-Pong service: {e}", exc_info=True)
            await asyncio.sleep(PING_INTERVAL) # Avoid fast-crashing loops

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    logger.info("Application startup...")
    connect_to_db_with_retry()
    init_system_settings()  # <-- Lägg till denna rad
    # Start the RabbitMQ listener as a background task
    app.state.rabbitmq_listener_task = asyncio.create_task(listen_to_status_updates(status_manager))
    # Start the Ping-Pong service as a background task
    app.state.ping_pong_task = asyncio.create_task(start_ping_pong_service(status_manager))
    yield
    # Code to run on shutdown
    logger.info("Application shutdown.")
    app.state.rabbitmq_listener_task.cancel()
    app.state.ping_pong_task.cancel()
    try:
        await app.state.rabbitmq_listener_task
    except asyncio.CancelledError:
        logger.info("RabbitMQ listener task cancelled.")
    try:
        await app.state.ping_pong_task
    except asyncio.CancelledError:
        logger.info("Ping-Pong service task cancelled.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows the React app to connect
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.include_router(config_router)

@app.get("/files/", response_model=List[schemas.File])
def get_files(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    files = db.query(models.File).order_by(models.File.id.desc()).offset(skip).limit(limit).all()
    return files

@app.get("/files/{file_id}/download")
async def download_file(file_id: int, db: Session = Depends(get_db)):
    db_file = db.query(models.File).filter(models.File.id == file_id).first()

    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in DB")

    # Security check: Only allow downloading of clean files
    if db_file.scan_status != models.ScanStatus.CLEAN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="File is not clean and cannot be downloaded.")

    if not os.path.exists(db_file.filepath):
        logger.error(f"File not found on disk at path: {db_file.filepath}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")

    return FileResponse(path=db_file.filepath, filename=db_file.filename, media_type='application/octet-stream')

@app.get("/")
def root():
    return {"message": "Backend is running"}
