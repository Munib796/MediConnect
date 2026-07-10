from sqlalchemy import Column, Integer, String, DateTime, Time, ForeignKey, ARRAY, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from src.utils.database import Base


class AffiliationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class DoctorHospital(Base):
    __tablename__ = "doctor_hospitals"

    id = Column(Integer, primary_key=True, index=True)

    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)

    fee = Column(Integer, nullable=False)
    days = Column(ARRAY(String), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    patients_per_day = Column(Integer, nullable=False)

    document_1_url = Column(String, nullable=False)
    document_2_url = Column(String, nullable=False)

    status = Column(Enum(AffiliationStatus), nullable=False, default=AffiliationStatus.pending)
    is_available = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, default=datetime.now)

    @property
    def hospital_name(self) -> str:
        return self.hospital.name
    
    @property
    def hospital_address(self) -> str | None:
        return self.hospital.address
    
    @property
    def doctor_name(self) -> str:
        return self.doctor.name

    @property
    def specialization_name(self) -> str:
        return self.doctor.specialization.name

    doctor = relationship("Doctor", backref="hospital_affiliations")
    hospital = relationship("Hospital", backref="doctor_affiliations")
    