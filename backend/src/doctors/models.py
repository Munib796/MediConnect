from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from src.utils.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)

    name = Column(String, nullable=False)
    qualifications = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String, nullable=True)

    specialization_id = Column(Integer, ForeignKey("specializations.id"), nullable=False)
    specialization = relationship("Specialization", backref="doctors")

    created_at = Column(DateTime, default=datetime.now)