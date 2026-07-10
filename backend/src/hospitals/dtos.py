from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import time


class HospitalListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: Optional[str] = None
    image_url: Optional[str] = None
    city_id: int


class DoctorAtHospitalResponse(BaseModel):
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
    

class PaginatedHospitalResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[HospitalListResponse]


class PaginatedDoctorAtHospitalResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[DoctorAtHospitalResponse]