from enum import Enum

class ScanStatus(str, Enum):
    PENDING = "pending"
    SCANNING = "scanning"
    CLEAN = "clean"
    INFECTED = "infected"
    ERROR = "error"
    QUARANTINED = "quarantined"
    DELETED = "deleted"
