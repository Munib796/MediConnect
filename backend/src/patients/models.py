from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

from src.utils.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)

    name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.now)