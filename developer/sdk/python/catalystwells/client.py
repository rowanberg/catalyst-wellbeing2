"""
CatalystWells Python SDK

Official SDK for the CatalystWells Education Platform API

Version: 1.0.0
License: MIT
"""

import httpx
import hashlib
import base64
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass, field
from enum import Enum


class Environment(Enum):
    SANDBOX = "sandbox"
    PRODUCTION = "production"


class NotificationType(Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    ANNOUNCEMENT = "announcement"


class Priority(Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class TokenResponse:
    access_token: str
    token_type: str
    expires_in: int
    scope: str
    refresh_token: Optional[str] = None


@dataclass
class Student:
    id: str
    enrollment_number: str
    name: str
    grade: str
    section: str
    roll_number: Optional[int] = None
    avatar_url: Optional[str] = None
    school: Optional[Dict[str, str]] = None


@dataclass
class AttendanceRecord:
    date: str
    status: str
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None


class CatalystWellsError(Exception):
    """Exception raised for CatalystWells API errors."""
    
    def __init__(self, code: str, description: str, status: int):
        self.code = code
        self.description = description
        self.status = status
        super().__init__(f"{code}: {description}")


class CatalystWells:
    """
    CatalystWells Python SDK Client
    
    Usage:
        client = CatalystWells(
            client_id="your_client_id",
            client_secret="your_client_secret",
            environment=Environment.SANDBOX
        )
    """
    
    def __init__(
        self,
        client_id: str,
        client_secret: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        environment: Environment = Environment.SANDBOX,
        base_url: Optional[str] = None
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.environment = environment
        
        if base_url:
            self.base_url = base_url
        elif environment == Environment.PRODUCTION:
            self.base_url = "https://developer.catalystwells.com"
        else:
            self.base_url = "https://sandbox.catalystwells.com"
        
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None
        self._http = httpx.Client(timeout=30.0)
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self._http.close()
    
    # ==================== Authentication ====================
    
    def get_authorization_url(
        self,
        scopes: List[str],
        state: Optional[str] = None,
        code_challenge: Optional[str] = None
    ) -> str:
        """Generate OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri or "",
            "response_type": "code",
            "scope": " ".join(scopes),
            "state": state or secrets.token_hex(32)
        }
        
        if code_challenge:
            params["code_challenge"] = code_challenge
            params["code_challenge_method"] = "S256"
        
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.base_url}/api/oauth/authorize?{query}"
    
    @staticmethod
    def generate_code_verifier() -> str:
        """Generate PKCE code verifier."""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_code_challenge(verifier: str) -> str:
        """Generate PKCE code challenge from verifier."""
        digest = hashlib.sha256(verifier.encode()).digest()
        return base64.urlsafe_b64encode(digest).decode().rstrip("=")
    
    def exchange_code(
        self,
        code: str,
        code_verifier: Optional[str] = None
    ) -> TokenResponse:
        """Exchange authorization code for tokens."""
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri or ""
        }
        
        if self.client_secret:
            data["client_secret"] = self.client_secret
        if code_verifier:
            data["code_verifier"] = code_verifier
        
        response = self._request(
            "POST",
            "/api/oauth/token",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        tokens = TokenResponse(**response)
        self._set_tokens(tokens)
        return tokens
    
    def refresh_access_token(self) -> TokenResponse:
        """Refresh access token using refresh token."""
        if not self._refresh_token:
            raise CatalystWellsError("no_refresh_token", "No refresh token available", 401)
        
        data = {
            "grant_type": "refresh_token",
            "refresh_token": self._refresh_token,
            "client_id": self.client_id
        }
        
        if self.client_secret:
            data["client_secret"] = self.client_secret
        
        response = self._request(
            "POST",
            "/api/oauth/token",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        tokens = TokenResponse(**response)
        self._set_tokens(tokens)
        return tokens
    
    def set_tokens(self, tokens: Union[TokenResponse, Dict[str, Any]]) -> None:
        """Set tokens manually (for server-side usage)."""
        if isinstance(tokens, dict):
            tokens = TokenResponse(**tokens)
        self._set_tokens(tokens)
    
    def _set_tokens(self, tokens: TokenResponse) -> None:
        self._access_token = tokens.access_token
        self._refresh_token = tokens.refresh_token
        self._token_expiry = datetime.now() + timedelta(seconds=tokens.expires_in)
    
    def revoke_token(self, token: Optional[str] = None) -> None:
        """Revoke tokens."""
        self._request(
            "POST",
            "/api/oauth/revoke",
            data={
                "token": token or self._access_token or "",
                "client_id": self.client_id
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if not token or token == self._access_token:
            self._access_token = None
            self._refresh_token = None
            self._token_expiry = None
    
    # ==================== Students API ====================
    
    def get_current_student(self) -> Dict[str, Any]:
        """Get current authenticated student profile."""
        return self._authenticated_request("GET", "/api/v1/students/me")
    
    def get_student(self, student_id: str) -> Dict[str, Any]:
        """Get student by ID."""
        return self._authenticated_request("GET", f"/api/v1/students/{student_id}")
    
    def get_student_marks(
        self,
        student_id: str,
        term: Optional[str] = None,
        subject: Optional[str] = None,
        academic_year: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get student academic marks."""
        params = {}
        if term:
            params["term"] = term
        if subject:
            params["subject"] = subject
        if academic_year:
            params["academic_year"] = academic_year
        
        return self._authenticated_request(
            "GET",
            f"/api/v1/students/{student_id}/marks",
            params=params
        )
    
    # ==================== Attendance API ====================
    
    def get_student_attendance(
        self,
        student_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        month: Optional[str] = None,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get student attendance records."""
        params = {}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        if month:
            params["month"] = month
        if limit:
            params["limit"] = str(limit)
        
        return self._authenticated_request(
            "GET",
            f"/api/v1/attendance/student/{student_id}",
            params=params
        )
    
    # ==================== Timetable API ====================
    
    def get_student_timetable(
        self,
        student_id: str,
        day: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get student timetable."""
        params = {"day": day} if day else {}
        return self._authenticated_request(
            "GET",
            f"/api/v1/timetable/student/{student_id}",
            params=params
        )
    
    # ==================== Wellbeing API ====================
    
    def get_current_mood(
        self,
        student_id: Optional[str] = None,
        aggregated: bool = False
    ) -> Dict[str, Any]:
        """Get current mood state."""
        params = {}
        if student_id:
            params["student_id"] = student_id
        if aggregated:
            params["aggregated"] = "true"
        
        return self._authenticated_request(
            "GET",
            "/api/v1/wellbeing/mood/current",
            params=params
        )
    
    def get_mood_history(
        self,
        student_id: str,
        days: int = 30,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get mood history for a student."""
        return self._authenticated_request(
            "GET",
            "/api/v1/wellbeing/mood/history",
            params={"student_id": student_id, "days": str(days), "limit": str(limit)}
        )
    
    def get_behavior_summary(
        self,
        student_id: Optional[str] = None,
        class_id: Optional[str] = None,
        period: str = "month"
    ) -> Dict[str, Any]:
        """Get behavior summary."""
        params = {"period": period}
        if student_id:
            params["student_id"] = student_id
        if class_id:
            params["class_id"] = class_id
        
        return self._authenticated_request(
            "GET",
            "/api/v1/wellbeing/behavior/summary",
            params=params
        )
    
    # ==================== Schools API ====================
    
    def get_school(
        self,
        school_id: str,
        include: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get school information."""
        params = {"include": ",".join(include)} if include else {}
        return self._authenticated_request(
            "GET",
            f"/api/v1/schools/{school_id}",
            params=params
        )
    
    # ==================== Classes API ====================
    
    def get_class(
        self,
        class_id: str,
        include: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get class information."""
        params = {"include": ",".join(include)} if include else {}
        return self._authenticated_request(
            "GET",
            f"/api/v1/classes/{class_id}",
            params=params
        )
    
    # ==================== Assignments & Homework ====================
    
    def get_assignments(
        self,
        student_id: Optional[str] = None,
        class_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get assignments."""
        params = {"limit": str(limit)}
        if student_id:
            params["student_id"] = student_id
        if class_id:
            params["class_id"] = class_id
        if subject_id:
            params["subject_id"] = subject_id
        if status:
            params["status"] = status
        
        return self._authenticated_request("GET", "/api/v1/assignments", params=params)
    
    def get_homework(
        self,
        student_id: Optional[str] = None,
        class_id: Optional[str] = None,
        upcoming: bool = False,
        overdue: bool = False,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get homework."""
        params = {"limit": str(limit)}
        if student_id:
            params["student_id"] = student_id
        if class_id:
            params["class_id"] = class_id
        if upcoming:
            params["upcoming"] = "true"
        if overdue:
            params["overdue"] = "true"
        
        return self._authenticated_request("GET", "/api/v1/homework", params=params)
    
    # ==================== Notifications ====================
    
    def send_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.INFO,
        priority: Priority = Priority.NORMAL,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send notification to a user."""
        payload = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type.value,
            "priority": priority.value
        }
        if action_url:
            payload["action_url"] = action_url
        if action_label:
            payload["action_label"] = action_label
        if data:
            payload["data"] = data
        
        return self._authenticated_request(
            "POST",
            "/api/v1/notifications/send",
            json=payload
        )
    
    def send_bulk_notifications(
        self,
        user_ids: List[str],
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.INFO,
        priority: Priority = Priority.NORMAL
    ) -> Dict[str, Any]:
        """Send notifications to multiple users."""
        return self._authenticated_request(
            "PUT",
            "/api/v1/notifications/send",
            json={
                "user_ids": user_ids,
                "title": title,
                "message": message,
                "type": notification_type.value,
                "priority": priority.value
            }
        )
    
    # ==================== Announcements ====================
    
    def get_announcements(
        self,
        school_id: Optional[str] = None,
        grade_id: Optional[str] = None,
        class_id: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get announcements."""
        params = {"limit": str(limit)}
        if school_id:
            params["school_id"] = school_id
        if grade_id:
            params["grade_id"] = grade_id
        if class_id:
            params["class_id"] = class_id
        if category:
            params["category"] = category
        
        return self._authenticated_request("GET", "/api/v1/announcements", params=params)
    
    def create_announcement(
        self,
        school_id: str,
        title: str,
        content: str,
        grade_id: Optional[str] = None,
        class_id: Optional[str] = None,
        category: str = "general",
        priority: str = "normal",
        expires_at: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create an announcement."""
        payload = {
            "school_id": school_id,
            "title": title,
            "content": content,
            "category": category,
            "priority": priority
        }
        if grade_id:
            payload["grade_id"] = grade_id
        if class_id:
            payload["class_id"] = class_id
        if expires_at:
            payload["expires_at"] = expires_at
        
        return self._authenticated_request("POST", "/api/v1/announcements", json=payload)
    
    # ==================== Privacy ====================
    
    def get_consent_status(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Check consent status for a user."""
        params = {"user_id": user_id} if user_id else {}
        return self._authenticated_request("GET", "/api/v1/privacy/consent", params=params)
    
    def request_consent(
        self,
        user_id: str,
        consent_type: str,
        scope: Optional[List[str]] = None,
        purpose: Optional[str] = None,
        expires_in_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Request consent for data access."""
        payload = {
            "user_id": user_id,
            "consent_type": consent_type
        }
        if scope:
            payload["scope"] = scope
        if purpose:
            payload["purpose"] = purpose
        if expires_in_days:
            payload["expires_in_days"] = expires_in_days
        
        return self._authenticated_request("POST", "/api/v1/privacy/consent", json=payload)
    
    # ==================== HTTP Helpers ====================
    
    def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, str]] = None,
        data: Optional[Dict[str, str]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Make HTTP request."""
        url = f"{self.base_url}{path}"
        
        response = self._http.request(
            method=method,
            url=url,
            params=params,
            data=data,
            json=json,
            headers=headers
        )
        
        result = response.json()
        
        if response.status_code >= 400:
            raise CatalystWellsError(
                result.get("error", "unknown_error"),
                result.get("error_description", result.get("message", "Unknown error")),
                response.status_code
            )
        
        return result
    
    def _authenticated_request(
        self,
        method: str,
        path: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Make authenticated HTTP request."""
        # Auto-refresh if token expires soon
        if self._token_expiry and self._token_expiry < datetime.now() + timedelta(seconds=60):
            if self._refresh_token:
                self.refresh_access_token()
        
        if not self._access_token:
            raise CatalystWellsError("not_authenticated", "No access token available", 401)
        
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self._access_token}"
        
        return self._request(method, path, headers=headers, **kwargs)


# Convenience function
def create_client(
    client_id: str,
    client_secret: Optional[str] = None,
    redirect_uri: Optional[str] = None,
    environment: Environment = Environment.SANDBOX
) -> CatalystWells:
    """Create a CatalystWells client instance."""
    return CatalystWells(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
        environment=environment
    )
