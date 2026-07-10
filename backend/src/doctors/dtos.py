from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
from typing import List
from datetime import time


class DoctorSignup(BaseModel):
    email: EmailStr
    password: str
    name: str
    specialization_id: int
    qualifications: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one number.")
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter.")
        return value


class DoctorLogin(BaseModel):
    email: EmailStr
    password: str


class DoctorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    specialization_id: int
    qualifications: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_verified: bool
    created_at: datetime


class DoctorProfileUpdate(BaseModel):
    name: Optional[str] = None
    specialization_id: Optional[int] = None
    qualifications: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one number.")
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter.")
        return value
    

class DoctorSearchResult(BaseModel):
    doctor_hospital_id: int
    doctor_id: int
    doctor_name: str
    specialization_id: int
    specialization_name: str
    qualifications: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    fee: int
    days: List[str]
    start_time: time
    end_time: time
    patients_per_day: int
    avg_rating: Optional[float] = None
    review_count: int = 0
    hospital_id: int
    hospital_name: str
    hospital_address: Optional[str] = None
    city_id: int


class PaginatedDoctorSearchResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[DoctorSearchResult]