from fastapi import APIRouter, HTTPException, UploadFile, Form, File, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import pika
import json
import os
import shutil
from sqlalchemy.orm import Session
from datetime import datetime

import schemas
from database import models
from database.database import SessionLocal
from enums import ScanStatus

router = APIRouter()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

UPLOAD_DIR = "/uploads"

@router.post("/upload/", response_model=schemas.FileUploadResponse)
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
        credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
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

@router.get("/files/", response_model=List[schemas.File])
def get_files(db: Session = Depends(get_db)):
    files = db.query(models.File).all()
    return files

@router.get("/files/{file_id}", response_model=schemas.File)
def get_file(file_id: int, db: Session = Depends(get_db)):
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
    if db_file.scan_status != ScanStatus.CLEAN.value:
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

@router.get("/config/system-settings", response_model=List[schemas.SystemSetting])
def get_system_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSetting).all()
    return settings

@router.put("/config/system-settings/{setting_id}", response_model=schemas.SystemSetting)
def update_system_setting(setting_id: int, setting: schemas.SystemSettingUpdate, db: Session = Depends(get_db)):
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

@router.get("/")
def root():
    return {"message": "Backend is running"}
