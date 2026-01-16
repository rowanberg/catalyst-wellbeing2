"""
CatalystWells Python SDK
"""

from .client import (
    CatalystWells,
    CatalystWellsError,
    TokenResponse,
    Student,
    AttendanceRecord,
    Environment,
    NotificationType,
    Priority,
    create_client
)

__version__ = "1.0.0"
__all__ = [
    "CatalystWells",
    "CatalystWellsError",
    "TokenResponse",
    "Student",
    "AttendanceRecord",
    "Environment",
    "NotificationType",
    "Priority",
    "create_client"
]
