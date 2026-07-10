from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
import jwt

from datetime import time

from src.utils.settings import settings
from src.utils.database import get_db
from src.doctors.models import Doctor
from src.patients.models import Patient

password_hash = PasswordHash.recommended()
security = HTTPBearer()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")


def get_current_patient(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Patient:
    payload = decode_access_token(credentials.credentials)
    if payload.get("role") != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as a patient.")
    patient = db.query(Patient).filter(Patient.id == payload.get("patient_id")).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Patient not found.")
    return patient


def get_current_doctor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Doctor:
    payload = decode_access_token(credentials.credentials)
    if payload.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as a doctor.")
    doctor = db.query(Doctor).filter(Doctor.id == payload.get("doctor_id")).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Doctor not found.")
    return doctor


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_access_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as admin.")
    return payload



def create_email_token(data: dict, purpose: str, expire_hours: int = 24) -> str:
    to_encode = data.copy()
    expire = datetime.now() + timedelta(hours=expire_hours)
    to_encode.update({"exp": expire, "purpose": purpose})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_email_token(token: str, expected_purpose: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired link.")

    if payload.get("purpose") != expected_purpose:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token purpose.")

    return payload





# to accept time strings like "9:00" or "21:30" and convert them to time objects i.e 09:00 if 9:00 is provided

def normalize_time_string(value: str) -> time:
    value = value.strip()
    parts = value.split(":")
    parts[0] = parts[0].zfill(2)
    normalized = ":".join(parts)

    try:
        return time.fromisoformat(normalized)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid time format: '{value}'. Use HH:MM in 24-hour format (e.g. 09:00 or 21:30).",
        )


# To handle Duplication Dr. in the mail

def normalize_doctor_name(name: str) -> str:
    name = name.strip()
    prefixes = ["dr.", "dr", "doctor"]
    for prefix in prefixes:
        if name.lower().startswith(prefix):
            name = name[len(prefix):].strip(" .")
            break
    return name