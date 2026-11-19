import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field



class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    email: EmailStr | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class SecurityInfoResponse(BaseModel):
    session_validity_minutes: int = 30
    jwt_algorithm: str = "HS256"
    encryption_standard: str = "Chiffrement HDS certifié"
    last_login: datetime | None = None
    active_device: str = "Chrome / Windows — session active"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    phone: str | None = None
    date_of_birth: str | None = None
    address: str | None = None
    disease: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AdminPatientAccountCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)