from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from src.utils.cloudinary import upload_file_to_cloudinary
import jwt

from src.utils.settings import settings
from src.admin.dtos import (
    AdminLogin, TokenResponse,
    CityCreate, SpecializationCreate, HospitalCreate,
)
from src.cities.models import City
from src.specializations.models import Specialization
from src.hospitals.models import Hospital
from src.doctors.models import Doctor
from src.doctor_hospitals.models import DoctorHospital


def login_admin(login_data: AdminLogin) -> TokenResponse:
    if login_data.email != settings.ADMIN_EMAIL or login_data.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials.")

    expire = datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.encode(
        {"email": login_data.email, "role": "admin", "exp": expire},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return TokenResponse(access_token=access_token)


def create_city(city_data: CityCreate, db: Session) -> City:
    existing = db.query(City).filter(func.lower(City.name) == city_data.name.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="City already exists.")

    city = City(name=city_data.name, province=city_data.province)
    db.add(city)
    db.commit()
    db.refresh(city)
    return city


def create_specialization(spec_data: SpecializationCreate, db: Session) -> Specialization:
    existing = db.query(Specialization).filter(func.lower(Specialization.name) == spec_data.name.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Specialization already exists.")

    specialization = Specialization(name=spec_data.name)
    db.add(specialization)
    db.commit()
    db.refresh(specialization)
    return specialization


def create_hospital(hospital_data: HospitalCreate, db: Session) -> Hospital:
    city = db.query(City).filter(City.id == hospital_data.city_id).first()
    if not city:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid city selected.")

    existing = db.query(Hospital).filter(
        func.lower(Hospital.name) == hospital_data.name.lower(),
        func.lower(Hospital.address) == (hospital_data.address or "").lower(),
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A hospital with this exact name and address already exists.",
        )

    hospital = Hospital(
        name=hospital_data.name,
        address=hospital_data.address,
        city_id=hospital_data.city_id,
    )
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital


def upload_hospital_image(hospital_id: int, file_bytes: bytes, filename: str, db: Session) -> Hospital:
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")

    image_url = upload_file_to_cloudinary(file_bytes, filename, folder="mediconnect/hospitals")
    hospital.image_url = image_url
    db.commit()
    db.refresh(hospital)

    return hospital


# City Updates
def list_all_cities(db: Session) -> list:
    return db.query(City).order_by(City.name).all()


def update_city(city_id: int, update_data, db: Session) -> City:
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")

    update_fields = update_data.model_dump(exclude_unset=True)

    if "name" in update_fields:
        existing = db.query(City).filter(
            func.lower(City.name) == update_fields["name"].lower(), City.id != city_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A city with this name already exists.")

    for field, value in update_fields.items():
        setattr(city, field, value)

    db.commit()
    db.refresh(city)
    return city


def delete_city(city_id: int, db: Session) -> dict:
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")

    hospital_count = db.query(Hospital).filter(Hospital.city_id == city_id).count()
    if hospital_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {hospital_count} hospital(s) still reference this city.",
        )

    db.delete(city)
    db.commit()
    return {"message": "City deleted successfully."}

# Specialization Updates

def list_all_specializations(db: Session) -> list:
    return db.query(Specialization).order_by(Specialization.name).all()


def update_specialization(specialization_id: int, update_data, db: Session) -> Specialization:
    specialization = db.query(Specialization).filter(Specialization.id == specialization_id).first()
    if not specialization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specialization not found.")

    update_fields = update_data.model_dump(exclude_unset=True)

    if "name" in update_fields:
        existing = db.query(Specialization).filter(
            func.lower(Specialization.name) == update_fields["name"].lower(), Specialization.id != specialization_id
        ).first()

        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A specialization with this name already exists.")

    for field, value in update_fields.items():
        setattr(specialization, field, value)

    db.commit()
    db.refresh(specialization)
    return specialization


def delete_specialization(specialization_id: int, db: Session) -> dict:
    specialization = db.query(Specialization).filter(Specialization.id == specialization_id).first()
    if not specialization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specialization not found.")

    doctor_count = db.query(Doctor).filter(Doctor.specialization_id == specialization_id).count()
    if doctor_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {doctor_count} doctor(s) still reference this specialization.",
        )

    db.delete(specialization)
    db.commit()
    return {"message": "Specialization deleted successfully."}


# Hospital Updates

def list_all_hospitals(db: Session) -> list:
    return db.query(Hospital).order_by(Hospital.name).all()


def update_hospital(hospital_id: int, update_data, db: Session) -> Hospital:
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")

    update_fields = update_data.model_dump(exclude_unset=True)

    if "city_id" in update_fields:
        city = db.query(City).filter(City.id == update_fields["city_id"]).first()
        if not city:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid city selected.")

    check_name = update_fields.get("name", hospital.name)
    check_address = update_fields.get("address", hospital.address)

    existing = db.query(Hospital).filter(
        func.lower(Hospital.name) == check_name.lower(),
        func.lower(Hospital.address) == (check_address or "").lower(),
        Hospital.id != hospital_id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A hospital with this exact name and address already exists.",
        )

    for field, value in update_fields.items():
        setattr(hospital, field, value)

    db.commit()
    db.refresh(hospital)
    return hospital


def delete_hospital(hospital_id: int, db: Session) -> dict:
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")

    affiliation_count = db.query(DoctorHospital).filter(DoctorHospital.hospital_id == hospital_id).count()
    if affiliation_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete: {affiliation_count} doctor affiliation(s) still reference this hospital.",
        )

    db.delete(hospital)
    db.commit()
    return {"message": "Hospital deleted successfully."}

