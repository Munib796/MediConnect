from fastapi import APIRouter, Depends, BackgroundTasks, Request, UploadFile, File, Query
from sqlalchemy.orm import Session

from src.doctors.models import Doctor

from src.utils.database import get_db
from src.utils.limiter import limiter
from src.doctors.dtos import (
    DoctorSignup, DoctorLogin, DoctorResponse, TokenResponse, DoctorProfileUpdate,
    ForgotPasswordRequest, ResetPasswordRequest, PaginatedDoctorSearchResponse,
)
from src.doctors.controller import (
    signup_doctor, verify_doctor_email, login_doctor, update_doctor_profile,
    upload_doctor_profile_photo, forgot_doctor_password, reset_doctor_password, search_doctors,
)

from src.utils.helpers import get_current_doctor

doctors_router = APIRouter(prefix="/doctors", tags=["Doctors"])


@doctors_router.post("/signup", response_model=DoctorResponse)
@limiter.limit("3/minute")
def signup(request: Request, signup_data: DoctorSignup, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return signup_doctor(signup_data, background_tasks, db)


@doctors_router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    return verify_doctor_email(token, db)


@doctors_router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, login_data: DoctorLogin, db: Session = Depends(get_db)):
    return login_doctor(login_data, db)


@doctors_router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, request_data: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return forgot_doctor_password(request_data, background_tasks, db)


@doctors_router.post("/reset-password")
def reset_password(request_data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return reset_doctor_password(request_data, db)


@doctors_router.patch("/me", response_model=DoctorResponse)
def update_profile(
    update_data: DoctorProfileUpdate,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return update_doctor_profile(update_data, current_doctor, db)

@doctors_router.post("/upload-profile-photo", response_model=DoctorResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    return upload_doctor_profile_photo(file_bytes, file.filename, current_doctor, db)

@doctors_router.get("/search", response_model=PaginatedDoctorSearchResponse)
def search(
    city_id: int = Query(None),
    specialization_id: int = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return search_doctors(db, city_id=city_id, specialization_id=specialization_id, skip=skip, limit=limit)
