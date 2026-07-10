from pydantic import BaseModel, ConfigDict
from datetime import time, datetime
from typing import List
import enum


class DaysGroup(str, enum.Enum):
    mon_wed = "Mon-Wed"
    thu_sat = "Thu-Sat"
    mon_sat = "Mon-Sat"


class DoctorHospitalCreate(BaseModel):
    hospital_id: int
    fee: int
    days_group: DaysGroup
    start_time: time
    end_time: time
    patients_per_day: int


class DoctorHospitalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    doctor_name: str
    specialization_name: str
    hospital_id: int
    hospital_name: str
    hospital_address: str | None = None
    fee: int
    days: List[str]
    start_time: time
    end_time: time
    patients_per_day: int
    document_1_url: str
    document_2_url: str
    status: str
    is_available: bool
    created_at: datetime

class PaginatedDoctorHospitalResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[DoctorHospitalResponse]

class DoctorHospitalPublicResponse(BaseModel):
    doctor_hospital_id: int
    doctor_id: int
    doctor_name: str
    specialization_id: int
    specialization_name: str
    qualifications: str | None = None
    experience_years: int | None = None
    bio: str | None = None
    profile_image_url: str | None = None
    fee: int
    days: List[str]
    start_time: time
    end_time: time
    patients_per_day: int
    avg_rating: float | None = None
    review_count: int = 0
    hospital_id: int
    hospital_name: str
    hospital_address: str | None = None