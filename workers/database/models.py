from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
import enum
from .database import Base

class ScanStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCANNING = "SCANNING"
    CLEAN = "CLEAN"
    INFECTED = "INFECTED"
    ERROR = "ERROR"
    QUARANTINED = "QUARANTINED"
    DELETED = "DELETED"

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    filepath = Column(String, unique=True)
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
    scan_status = Column(Enum(ScanStatus), default=ScanStatus.PENDING)
    scan_result = Column(String, nullable=True)
