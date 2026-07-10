from pydantic import BaseModel, ConfigDict, field_validator, field_serializer
from datetime import date, datetime, time
from typing import Optional
from typing import List
import enum


class PaymentMode(str, enum.Enum):
    cash = "cash"
    online = "online"


class AppointmentCreate(BaseModel):
    doctor_hospital_id: int
    appointment_date: date
    patient_name: str
    patient_age: int
    patient_gender: str
    contact_phone: str
    reason: Optional[str] = None
    payment_mode: PaymentMode

    @field_validator("appointment_date", mode="before")
    @classmethod
    def parse_appointment_date(cls, value):
        if isinstance(value, str):
            try:
                return datetime.strptime(value, "%d-%m-%Y").date()
            except ValueError:
                raise ValueError("appointment_date must be in DD-MM-YYYY format, e.g. 10-07-2026")
        return value

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        digits = value.strip()
        if not digits.isdigit() or len(digits) != 11:
            raise ValueError("Phone number must be exactly 11 digits, e.g. 03001234567")
        return digits

class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_hospital_id: int
    appointment_date: date
    token_number: int
    start_time: time
    end_time: time
    patient_name: str
    patient_age: int
    patient_gender: str
    contact_phone: str
    reason: Optional[str] = None
    status: str
    payment_mode: str
    payment_status: str
    stripe_session_id: Optional[str] = None
    created_at: datetime
    doctor_name: str
    hospital_name: str
    hospital_address: Optional[str] = None
    has_review: bool
    review_rating: Optional[int] = None
    review_comment: Optional[str] = None
    specialization_name: str

    @field_serializer("appointment_date")
    def serialize_appointment_date(self, value: date) -> str:
        return value.strftime("%d-%m-%Y")


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class PaginatedAppointmentResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[AppointmentResponse]