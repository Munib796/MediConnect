from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from src.doctor_hospitals.models import DoctorHospital, AffiliationStatus
from src.doctor_hospitals.dtos import DoctorHospitalCreate
from src.hospitals.models import Hospital
from src.doctors.models import Doctor
from src.utils.cloudinary import upload_file_to_cloudinary
from src.utils.mails import send_affiliation_status_email
from src.reviews.controller import get_doctor_rating_summary


DAY_GROUP_MAP = {
    "Mon-Wed": ["Mon", "Tue", "Wed"],
    "Thu-Sat": ["Thu", "Fri", "Sat"],
    "Mon-Sat": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
}

def check_schedule_conflict(doctor_id: int, days: list, start_time, end_time, db: Session) -> None:
    existing_affiliations = db.query(DoctorHospital).filter(
        DoctorHospital.doctor_id == doctor_id,
        DoctorHospital.status.in_([AffiliationStatus.pending, AffiliationStatus.approved]),
    ).all()

    for affiliation in existing_affiliations:
        shared_days = set(affiliation.days) & set(days)
        if not shared_days:
            continue

        times_overlap = start_time < affiliation.end_time and affiliation.start_time < end_time
        if times_overlap:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Schedule conflict: you already have a "
                    f"{affiliation.status.value} affiliation on {sorted(shared_days)} "
                    f"from {affiliation.start_time} to {affiliation.end_time}."
                ),
            )


def submit_doctor_hospital_request(
    request_data: DoctorHospitalCreate,
    document_1_bytes: bytes,
    document_1_filename: str,
    document_2_bytes: bytes,
    document_2_filename: str,
    current_doctor: Doctor,
    db: Session,
) -> DoctorHospital:
    if not current_doctor.qualifications or not current_doctor.experience_years or not current_doctor.bio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile (qualifications, experience, bio) before applying to a hospital.",
        )

    hospital = db.query(Hospital).filter(Hospital.id == request_data.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid hospital selected.")
    
    expanded_days = DAY_GROUP_MAP[request_data.days_group.value]

    check_schedule_conflict(
        current_doctor.id, expanded_days, request_data.start_time, request_data.end_time, db
    )

    document_1_url = upload_file_to_cloudinary(
        document_1_bytes, document_1_filename, folder="mediconnect/doctor_hospitals/documents"
    )
    document_2_url = upload_file_to_cloudinary(
        document_2_bytes, document_2_filename, folder="mediconnect/doctor_hospitals/documents"
    )

    affiliation = DoctorHospital(
        doctor_id=current_doctor.id,
        hospital_id=request_data.hospital_id,
        fee=request_data.fee,
        days=expanded_days,
        start_time=request_data.start_time,
        end_time=request_data.end_time,
        patients_per_day=request_data.patients_per_day,
        document_1_url=document_1_url,
        document_2_url=document_2_url,
        status=AffiliationStatus.pending,
    )

    db.add(affiliation)
    db.commit()
    db.refresh(affiliation)

    return affiliation


def list_pending_affiliations(db: Session, skip: int = 0, limit: int = 20) -> dict:
    query = db.query(DoctorHospital).filter(DoctorHospital.status == AffiliationStatus.pending)
    total = query.count()
    items = query.order_by(DoctorHospital.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "skip": skip, "limit": limit, "items": items}


def approve_affiliation(affiliation_id: int, background_tasks: BackgroundTasks, db: Session) -> DoctorHospital:
    affiliation = db.query(DoctorHospital).filter(DoctorHospital.id == affiliation_id).first()
    if not affiliation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affiliation request not found.")

    if affiliation.status != AffiliationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This request is already {affiliation.status.value}, cannot approve again.",
        )

    affiliation.status = AffiliationStatus.approved
    db.commit()
    db.refresh(affiliation)

    background_tasks.add_task(
        send_affiliation_status_email,
        affiliation.doctor.email, affiliation.doctor.name, affiliation.hospital.name, "approved"
    )

    return affiliation


def reject_affiliation(affiliation_id: int, background_tasks: BackgroundTasks, db: Session) -> DoctorHospital:
    affiliation = db.query(DoctorHospital).filter(DoctorHospital.id == affiliation_id).first()
    if not affiliation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affiliation request not found.")

    if affiliation.status != AffiliationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This request is already {affiliation.status.value}, cannot reject again.",
        )

    affiliation.status = AffiliationStatus.rejected
    db.commit()
    db.refresh(affiliation)

    background_tasks.add_task(
        send_affiliation_status_email,
        affiliation.doctor.email, affiliation.doctor.name, affiliation.hospital.name, "rejected"
    )

    return affiliation


def reject_affiliation(affiliation_id: int, background_tasks: BackgroundTasks, db: Session) -> DoctorHospital:
    affiliation = db.query(DoctorHospital).filter(DoctorHospital.id == affiliation_id).first()
    if not affiliation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affiliation request not found.")

    if affiliation.status != AffiliationStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This request is already {affiliation.status.value}, cannot reject again.",
        )

    affiliation.status = AffiliationStatus.rejected
    db.commit()
    db.refresh(affiliation)

    background_tasks.add_task(
        send_affiliation_status_email,
        affiliation.doctor.email, affiliation.doctor.name, affiliation.hospital.name, "rejected"
    )

    return affiliation

def list_my_affiliations(doctor_id: int, db: Session) -> list:
    return db.query(DoctorHospital).filter(
        DoctorHospital.doctor_id == doctor_id
    ).all()


def toggle_availability(affiliation_id: int, current_doctor_id: int, db: Session) -> DoctorHospital:
    affiliation = db.query(DoctorHospital).filter(
        DoctorHospital.id == affiliation_id,
        DoctorHospital.doctor_id == current_doctor_id,
    ).first()

    if not affiliation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affiliation not found.")

    if affiliation.status != AffiliationStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved affiliations can have their availability toggled.",
        )

    affiliation.is_available = not affiliation.is_available
    db.commit()
    db.refresh(affiliation)

    return affiliation


def get_public_affiliation(doctor_hospital_id: int, db: Session) -> dict:

    affiliation = db.query(DoctorHospital).filter(
        DoctorHospital.id == doctor_hospital_id,
        DoctorHospital.status == AffiliationStatus.approved,
        DoctorHospital.is_available == True,
    ).first()

    if not affiliation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This doctor listing is no longer available.",
        )

    doctor = affiliation.doctor
    hospital = affiliation.hospital
    rating_summary = get_doctor_rating_summary(doctor.id, db)
    return {
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
        "hospital_id": hospital.id,
        "hospital_name": hospital.name,
        "hospital_address": hospital.address,
    }