from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.utils.database import get_db
from src.utils.helpers import get_current_patient
from src.patients.models import Patient
from src.reviews.dtos import ReviewCreate, ReviewResponse
from src.reviews.controller import create_review, get_doctor_reviews, get_doctor_rating_summary
from src.utils.limiter import limiter

reviews_router = APIRouter(prefix="/reviews", tags=["Reviews"])


@reviews_router.post("", response_model=ReviewResponse)
@limiter.limit("5/minute")
def add_review(
    request: Request,
    review_data: ReviewCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return create_review(review_data, current_patient, db)


@reviews_router.get("/doctor/{doctor_id}", response_model=list[ReviewResponse])
def doctor_reviews(doctor_id: int, db: Session = Depends(get_db)):
    return get_doctor_reviews(doctor_id, db)


@reviews_router.get("/doctor/{doctor_id}/summary")
def doctor_rating_summary(doctor_id: int, db: Session = Depends(get_db)):
    return get_doctor_rating_summary(doctor_id, db)