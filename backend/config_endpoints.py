import os
import shutil
import pika
from datetime import datetime
from typing import List
import asyncio
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Security, status, Body
from sqlalchemy.orm import Session
from database.database import get_db
from database import models
from enums import ScanStatus
from schemas import File as FileResponse, FileUpdate, ScanStatusUpdate, FileUploadResponse, SystemSetting, SystemSettingUpdate
import logging
import json
from sqlalchemy.exc import IntegrityError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt as pyjwt

# Add a logger for this module
logger = logging.getLogger(__name__)

security = HTTPBearer()

# Dummy public key för JWT-validering (ersätt med riktig i produktion)
DUMMY_PUBLIC_KEY = "your-public-key"

# Dependency: Kontrollera SSO/RBAC och roll

def get_current_user(role: str = "user"):
    def dependency(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
        sso_config = get_sso_rbac_config(db)
        if not sso_config["enabled"]:
            # Dev-läge: tillåt alla, returnera dummy-user
            return {"username": "devuser", "roles": ["admin", "user"], "dev_mode": True}
        # SSO/RBAC på: kontrollera JWT och grupp
        try:
            payload = pyjwt.decode(credentials.credentials, DUMMY_PUBLIC_KEY, algorithms=["RS256"], options={"verify_signature": False})
            username = payload.get("preferred_username") or payload.get("sub")
            groups = payload.get("groups", [])
            if not username or not groups:
                raise HTTPException(status_code=401, detail="Invalid token")
            # Kontrollera roll
            if role == "admin":
                if sso_config["ad_group_admins"] not in groups:
                    raise HTTPException(status_code=403, detail="Admin access required")
            elif role == "user":
                if sso_config["ad_group_users"] not in groups and sso_config["ad_group_admins"] not in groups:
                    raise HTTPException(status_code=403, detail="User access required")
            return {"username": username, "roles": groups, "dev_mode": False}
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Auth failed: {e}")
    return dependency

class ConnectionManager:
    def __init__(self):
        # Store websockets and their last pong time
        self.active_connections: dict[WebSocket, datetime] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        # Initialize with the current time, assuming the connection is healthy
        self.active_connections[websocket] = datetime.utcnow()
        logger.info(f"New WebSocket connection: {websocket.client}. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]
            logger.info(f"WebSocket disconnected: {websocket.client}. Total connections: {len(self.active_connections)}")

    def update_last_pong(self, websocket: WebSocket):
        """Updates the timestamp for a given websocket when a pong is received."""
        if websocket in self.active_connections:
            self.active_connections[websocket] = datetime.utcnow()
            logger.debug(f"Pong received from {websocket.client}")

    async def broadcast(self, message: str):
        # Create a list of connections to iterate over, to avoid issues with disconnections during broadcast
        for connection in list(self.active_connections.keys()):
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                self.disconnect(connection)
            except Exception as e:
                logger.error(f"Error sending message to {connection.client}: {e}")
                self.disconnect(connection)

manager = ConnectionManager()
status_manager = ConnectionManager() # Manager for status updates

# In-memory cache for the last known status of each file
file_status_cache = {}

# --- Maintenance Mode Check Decorator ---
from functools import wraps
import inspect

def require_not_maintenance_mode(endpoint_func):
    @wraps(endpoint_func)
    async def async_wrapper(*args, db: Session = Depends(get_db), **kwargs):
        setting = db.query(models.SystemSetting).filter_by(key="MAINTENANCE_MODE").first()
        if setting and setting.value == "true":
            raise HTTPException(status_code=503, detail="System is in maintenance mode.")
        if inspect.iscoroutinefunction(endpoint_func):
            return await endpoint_func(*args, db=db, **kwargs)
        else:
            return endpoint_func(*args, db=db, **kwargs)
    return async_wrapper

router = APIRouter()

UPLOAD_DIR = "/uploads"

@router.post("/upload/", response_model=FileUploadResponse)
@require_not_maintenance_mode
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Get file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    # Check if a file with the same path already exists
    db_file = db.query(models.File).filter(models.File.filepath == file_path).first()

    # Save the uploaded file, overwriting if it exists
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

    if db_file:
        # If file exists, update its status to PENDING for re-scanning
        db_file.scan_status = models.ScanStatus.PENDING
        db_file.scan_details = "Re-uploaded for scanning."
        db_file.upload_date = datetime.utcnow() # Update timestamp
        db_file.filesize = file_size
        db_file.is_quarantined = False # Reset quarantine status
    else:
        # If file doesn't exist, create a new database record
        db_file = models.File(
            filename=file.filename, 
            filepath=file_path, 
            filesize=file_size,
            scan_status=models.ScanStatus.PENDING
        )
        db.add(db_file)
    
    db.commit()
    db.refresh(db_file)

    # Publish message to RabbitMQ
    try:
        rabbitmq_user = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
        rabbitmq_pass = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
        rabbitmq_host = os.getenv("RABBITMQ_HOST", "rabbitmq")
        credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=rabbitmq_host, credentials=credentials)
        )
        channel = connection.channel()
        channel.queue_declare(queue='file_queue', durable=True)
        message = {'file_path': file_path, 'file_id': db_file.id}
        channel.basic_publish(
            exchange='',
            routing_key='file_queue',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            ))
        connection.close()
        return {"filename": file.filename, "id": db_file.id, "status": "PENDING"}
    except Exception as e:
        # If RabbitMQ fails, update DB status to ERROR
        db_file.scan_status = models.ScanStatus.ERROR
        db_file.scan_details = f"Failed to publish to RabbitMQ: {e}"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Could not publish message to RabbitMQ: {e}")

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logging.info("Client disconnected from /ws.")

@router.websocket("/ws/status")
async def websocket_status_endpoint(websocket: WebSocket):
    await status_manager.connect(websocket)
    try:
        while True:
            # Wait for messages from the client (e.g., pong responses)
            data = await websocket.receive_text()
            logger.debug(f"Received message from {websocket.client}: {data}")
            if data == '{"type":"pong"}':
                status_manager.update_last_pong(websocket)

    except WebSocketDisconnect:
        status_manager.disconnect(websocket)
        logger.info(f"Client {websocket.client} disconnected from status endpoint.")
    except Exception as e:
        logger.error(f"An error occurred in the status websocket for {websocket.client}: {e}")
        status_manager.disconnect(websocket)


@router.get("/files/", response_model=List[FileResponse])
@require_not_maintenance_mode
def get_files(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    files = db.query(models.File).order_by(models.File.upload_date.desc()).offset(skip).limit(limit).all()
    return files

@router.get("/files/{file_id}", response_model=FileResponse)
@require_not_maintenance_mode
async def get_file(file_id: int, db: Session = Depends(get_db)):
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@router.get("/download/{file_id}")
async def download_file(file_id: int, db: Session = Depends(get_db)):
    db_file = db.query(models.File).filter(models.File.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    # Only allow download if the scan status is 'clean'
    if db_file.scan_status != ScanStatus.CLEAN:
        raise HTTPException(status_code=403, detail=f"File cannot be downloaded. Status: {db_file.scan_status}")

    return FileResponse(db_file.filepath, media_type="application/octet-stream", filename=db_file.filename)

@router.post("/config/logo")
async def upload_logo(file: UploadFile = File(...)):
    # Implementation for uploading logo
    pass

@router.get("/config/logo")
async def get_logo():
    # Implementation for getting logo
    pass

@router.get("/config/files/count", response_model=int)
def get_files_count(db: Session = Depends(get_db)):
    count = db.query(models.File).count()
    return count

@router.get("/config/files/scanned-count", response_model=int)
def get_scanned_files_count(db: Session = Depends(get_db)):
    count = db.query(models.File).filter(models.File.status == models.ScanStatus.SCANNED).count()
    return count

@router.get("/config/files/infected-count", response_model=int)
def get_infected_files_count(db: Session = Depends(get_db)):
    count = db.query(models.File).filter(models.File.status == models.ScanStatus.INFECTED).count()
    return count

@router.get("/config/system-settings", response_model=List[SystemSetting])
def get_system_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSetting).all()
    return settings

@router.put("/config/system-settings/{setting_id}", response_model=SystemSetting)
def update_system_setting(setting_id: int, setting: SystemSettingUpdate, db: Session = Depends(get_db)):
    db_setting = db.query(models.SystemSetting).filter(models.SystemSetting.id == setting_id).first()
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    for key, value in setting.dict().items():
        setattr(db_setting, key, value)
    
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.post("/upload-chunk")
async def upload_chunk(file: UploadFile, 
                        chunkIndex: int = Form(...), 
                        fileName: str = Form(...)):
    try:
        with open(f"uploads/{fileName}.part{chunkIndex}", "wb") as f:
            f.write(file.file.read())
        return {"message": "Chunk uploaded successfully", "chunkIndex": chunkIndex}
    except Exception as e:
        return {"error": str(e)}

@router.post("/scan-virus")
async def scan_virus(file_path: str = Form(...)):
    if "file_path" not in file_path:
        raise HTTPException(status_code=422, detail="Missing 'file_path' key in request body")
    try:
        # Send file path to RabbitMQ queue
        connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
        channel = connection.channel()
        channel.queue_declare(queue='virus_scan')
        message = json.dumps({'file_path': file_path["file_path"]})
        channel.basic_publish(exchange='', routing_key='virus_scan', body=message)
        connection.close()
        return {"message": "File sent for virus scanning", "file_path": file_path["file_path"]}
    except Exception as e:
        return {"error": str(e)}

# --- Maintenance Mode Endpoints ---

@router.get("/config/maintenance-mode")
def get_maintenance_mode(db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).filter_by(key="MAINTENANCE_MODE").first()
    if not setting:
        raise HTTPException(status_code=500, detail="MAINTENANCE_MODE setting missing")
    return {"maintenance_mode": setting.value == "true"}

@router.post("/config/maintenance-mode")
def set_maintenance_mode(
    enabled: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    user=Depends(get_current_user(role="admin"))
):
    setting = db.query(models.SystemSetting).filter_by(key="MAINTENANCE_MODE").first()
    if not setting:
        raise HTTPException(status_code=500, detail="MAINTENANCE_MODE setting missing")
    setting.value = "true" if enabled else "false"
    db.commit()
    return {"maintenance_mode": setting.value == "true"}

# Utility: Hämta SSO/RBAC-status och config

def get_sso_rbac_config(db):
    settings = {s.key: s for s in db.query(models.SystemSetting).all()}
    enabled = settings.get("RBAC_SSO_ENABLED", None)
    if enabled and enabled.value == "true":
        return {
            "enabled": True,
            "ad_endpoint": settings.get("AD_ENDPOINT", None).value if settings.get("AD_ENDPOINT") else None,
            "ad_client_id": settings.get("AD_CLIENT_ID", None).value if settings.get("AD_CLIENT_ID") else None,
            "ad_client_secret": settings.get("AD_CLIENT_SECRET", None).value if settings.get("AD_CLIENT_SECRET") else None,
            "ad_group_users": settings.get("AD_GROUP_USERS", None).value if settings.get("AD_GROUP_USERS") else "users",
            "ad_group_admins": settings.get("AD_GROUP_ADMINS", None).value if settings.get("AD_GROUP_ADMINS") else "admins",
        }
    return {"enabled": False}

@router.post("/config/init-sso-settings")
def init_sso_settings(db: Session = Depends(get_db)):
    # Skapa default SSO/RBAC-inställningar om de saknas
    defaults = [
        {"key": "RBAC_SSO_ENABLED", "value": "false", "description": "Enable SSO/RBAC (true/false)"},
        {"key": "AD_ENDPOINT", "value": "", "description": "AD/SSO endpoint (OpenID Connect)"},
        {"key": "AD_CLIENT_ID", "value": "", "description": "AD/SSO client id"},
        {"key": "AD_CLIENT_SECRET", "value": "", "description": "AD/SSO client secret"},
        {"key": "AD_GROUP_USERS", "value": "users", "description": "AD group for normal users"},
        {"key": "AD_GROUP_ADMINS", "value": "admins", "description": "AD group for admins"},
    ]
    created = []
    for d in defaults:
        if not db.query(models.SystemSetting).filter_by(key=d["key"]).first():
            s = models.SystemSetting(**d)
            db.add(s)
            created.append(d["key"])
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"created": created}

@router.get("/config/sso-status")
def get_sso_status(db: Session = Depends(get_db)):
    return get_sso_rbac_config(db)

@router.get("/")
def root():
    return {"message": "Backend is running"}
