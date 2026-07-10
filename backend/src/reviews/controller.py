from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.reviews.models import Review
from src.reviews.dtos import ReviewCreate
from src.appointments.models import Appointment, AppointmentStatus
from src.patients.models import Patient


def create_review(review_data: ReviewCreate, current_patient: Patient, db: Session) -> Review:
    appointment = db.query(Appointment).filter(
        Appointment.id == review_data.appointment_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if appointment.patient_id != current_patient.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only review your own appointments.")

    if appointment.status != AppointmentStatus.completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can only review completed appointments.")

    existing_review = db.query(Review).filter(Review.appointment_id == review_data.appointment_id).first()
    if existing_review:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This appointment has already been reviewed.")

    review = Review(
        appointment_id=review_data.appointment_id,
        patient_id=current_patient.id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return review


def get_doctor_reviews(doctor_id: int, db: Session) -> list:
    return db.query(Review).join(Appointment).join(
        Appointment.doctor_hospital
    ).filter(
        Appointment.doctor_hospital.has(doctor_id=doctor_id)
    ).all()


def get_doctor_rating_summary(doctor_id: int, db: Session) -> dict:
    result = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("review_count"),
    ).join(Appointment).join(Appointment.doctor_hospital).filter(
        Appointment.doctor_hospital.has(doctor_id=doctor_id)
    ).first()

    avg_rating = round(result.avg_rating, 1) if result.avg_rating else None
    review_count = result.review_count or 0

    return {"avg_rating": avg_rating, "review_count": review_count}