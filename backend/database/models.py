from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from .database import Base
from enums import ScanStatus

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    filepath = Column(String, unique=True)
    filesize = Column(Integer, nullable=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    scan_status = Column(String, default=ScanStatus.PENDING.value)
    scan_date = Column(DateTime(timezone=True), nullable=True)
    scan_details = Column(String, nullable=True)
    is_quarantined = Column(Boolean, default=False, nullable=False)
    checksum = Column(String, nullable=True)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Boolean, default=False, nullable=False)
