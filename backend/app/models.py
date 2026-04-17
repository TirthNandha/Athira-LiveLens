from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# --- Users ---
class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    subject: Optional[str] = None
    created_at: Optional[str] = None


# --- Sessions ---
class SessionCreate(BaseModel):
    tutor_id: str
    subject: str
    scheduled_at: str
    duration_minutes: int = 60
    note: Optional[str] = None


class SessionUpdate(BaseModel):
    status: str  # 'accepted' or 'rejected'


class SessionOut(BaseModel):
    id: str
    student_id: str
    tutor_id: str
    subject: str
    scheduled_at: str
    duration_minutes: int
    status: str
    note: Optional[str] = None
    created_at: Optional[str] = None
    student_name: Optional[str] = None
    tutor_name: Optional[str] = None
