from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime,
    ForeignKey, Enum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from src.utils.database import Base


class AppointmentStatus(str, enum.Enum):
    booked = "booked"
    completed = "completed"
    cancelled = "cancelled"


class PaymentMode(str, enum.Enum):
    cash = "cash"
    online = "online"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        UniqueConstraint(
            "doctor_hospital_id", "appointment_date", "token_number",
            name="uq_appointment_slot"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_hospital_id = Column(Integer, ForeignKey("doctor_hospitals.id"), nullable=False)

    appointment_date = Column(Date, nullable=False)
    token_number = Column(Integer, nullable=False)

    patient_name = Column(String, nullable=False)
    patient_age = Column(Integer, nullable=False)
    patient_gender = Column(String, nullable=False)
    contact_phone = Column(String, nullable=False)
    reason = Column(Text, nullable=True)

    status = Column(Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.booked)

    payment_mode = Column(Enum(PaymentMode), nullable=False)
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    stripe_session_id = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.now)

    patient = relationship("Patient", backref="appointments")
    doctor_hospital = relationship("DoctorHospital", backref="appointments")

    @property
    def doctor_name(self) -> str:
        return self.doctor_hospital.doctor.name

    @property
    def hospital_name(self) -> str:
        return self.doctor_hospital.hospital.name
 
    @property
    def has_review(self) -> bool:
        return self.review is not None

    @property
    def review_rating(self):
        return self.review.rating if self.review else None

    @property
    def review_comment(self):
        return self.review.comment if self.review else None

    @property
    def hospital_address(self) -> str | None:
        return self.doctor_hospital.hospital.address
    
    @property
    def start_time(self):
        return self.doctor_hospital.start_time

    @property
    def end_time(self):
        return self.doctor_hospital.end_time
    
    @property
    def specialization_name(self) -> str:
        return self.doctor_hospital.doctor.specialization.name