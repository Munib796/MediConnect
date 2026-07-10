from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CityCreate(BaseModel):
    name: str
    province: Optional[str] = None


class CityResponse(BaseModel):
    id: int
    name: str
    province: Optional[str] = None

    class Config:
        from_attributes = True


class SpecializationCreate(BaseModel):
    name: str


class SpecializationResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class HospitalCreate(BaseModel):
    name: str
    address: str
    city_id: int

    @field_validator("address")
    @classmethod
    def validate_address(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Address is required.")
        return value.strip()


class HospitalResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    image_url: Optional[str] = None
    city_id: int

    class Config:
        from_attributes = True

class CityUpdate(BaseModel):
    name: Optional[str] = None
    province: Optional[str] = None


class SpecializationUpdate(BaseModel):
    name: Optional[str] = None


class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city_id: Optional[int] = None

    @field_validator("address")
    @classmethod
    def validate_address(cls, value):
        if value is not None and not value.strip():
            raise ValueError("Address cannot be blank.")
        return value.strip() if value else value

