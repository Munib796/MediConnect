from fastapi import APIRouter, Depends, BackgroundTasks, Request
from sqlalchemy.orm import Session

from src.utils.database import get_db
from src.utils.limiter import limiter
from src.patients.dtos import PatientSignup, PatientLogin, PatientResponse, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from src.patients.controller import signup_patient, verify_patient_email, login_patient, forgot_patient_password, reset_patient_password

patients_router = APIRouter(prefix="/patients", tags=["Patients"])


@patients_router.post("/signup", response_model=PatientResponse)
@limiter.limit("3/minute")
def signup(request: Request, signup_data: PatientSignup, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return signup_patient(signup_data, background_tasks, db)


@patients_router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    return verify_patient_email(token, db)


@patients_router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, login_data: PatientLogin, db: Session = Depends(get_db)):
    return login_patient(login_data, db)


@patients_router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, request_data: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return forgot_patient_password(request_data, background_tasks, db)


@patients_router.post("/reset-password")
def reset_password(request_data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return reset_patient_password(request_data, db)