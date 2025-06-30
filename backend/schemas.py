from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enums import ScanStatus

class FileBase(BaseModel):
    filename: str
    filesize: int
    
class FileCreate(FileBase):
    pass

class File(FileBase):
    id: int
    upload_date: datetime
    scan_status: ScanStatus
    scan_date: Optional[datetime] = None
    scan_details: Optional[str] = None
    is_quarantined: bool
    checksum: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class FileUploadResponse(BaseModel):
    filename: str
    id: int
    status: str

class FileUpdate(BaseModel):
    filename: Optional[str] = None

class ScanStatusUpdate(BaseModel):
    scan_status: ScanStatus
    scan_details: Optional[str] = None

class QuarantineOut(BaseModel):
    quarantined_files: List[File]

class SystemSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    extra: Optional[dict] = None

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSetting(SystemSettingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SystemSettingUpdate(SystemSettingBase):
    pass
