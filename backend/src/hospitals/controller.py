from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from src.hospitals.models import Hospital
from src.doctor_hospitals.models import DoctorHospital, AffiliationStatus
from src.doctors.models import Doctor
from src.reviews.controller import get_doctor_rating_summary


def list_hospitals(db: Session, city_id: Optional[int] = None, search: Optional[str] = None, skip: int = 0, limit: int = 20) -> dict:
    query = db.query(Hospital)

    if city_id:
        query = query.filter(Hospital.city_id == city_id)

    if search:
        query = query.filter(Hospital.name.ilike(f"%{search}%"))

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {"total": total, "skip": skip, "limit": limit, "items": items}


def get_hospital_by_id(hospital_id: int, db: Session) -> Hospital:
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")
    return hospital


def list_doctors_at_hospital(hospital_id: int, db: Session, specialization_id: Optional[int] = None, skip: int = 0, limit: int = 20) -> dict:
    get_hospital_by_id(hospital_id, db)

    query = db.query(DoctorHospital).filter(
        DoctorHospital.hospital_id == hospital_id,
        DoctorHospital.status == AffiliationStatus.approved,
        DoctorHospital.is_available == True,
    )

    if specialization_id:
        query = query.join(Doctor).filter(Doctor.specialization_id == specialization_id)

    total = query.count()
    affiliations = query.offset(skip).limit(limit).all()

    results = []
    for affiliation in affiliations:
        doctor = affiliation.doctor
        rating_summary = get_doctor_rating_summary(doctor.id, db)
        results.append({
            "doctor_hospital_id": affiliation.id,
            "doctor_id": doctor.id,
            "doctor_name": doctor.name,
            "specialization_id": doctor.specialization_id,
            "specialization_name": doctor.specialization.name,
            "qualifications": doctor.qualifications,
            "experience_years": doctor.experience_years,
            "bio": doctor.bio,
            "profile_image_url": doctor.profile_image_url,
            "fee": affiliation.fee,
            "days": affiliation.days,
            "start_time": affiliation.start_time,
            "end_time": affiliation.end_time,
            "patients_per_day": affiliation.patients_per_day,
            "avg_rating": rating_summary["avg_rating"],
            "review_count": rating_summary["review_count"],
        })

    return {"total": total, "skip": skip, "limit": limit, "items": results}