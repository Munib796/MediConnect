from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List

from src.utils.database import get_db
from src.utils.helpers import get_current_doctor, get_current_admin, normalize_time_string
from src.doctors.models import Doctor
from src.doctor_hospitals.dtos import DoctorHospitalCreate, DoctorHospitalResponse, DaysGroup, PaginatedDoctorHospitalResponse, DoctorHospitalPublicResponse
from src.doctor_hospitals.controller import (
    submit_doctor_hospital_request,
    list_pending_affiliations,
    approve_affiliation,
    reject_affiliation,
    list_my_affiliations,
    toggle_availability,
    get_public_affiliation,
)

doctor_hospitals_router = APIRouter(prefix="/doctor-hospitals", tags=["Doctor Hospitals"])


@doctor_hospitals_router.post("/apply", response_model=DoctorHospitalResponse)
async def apply_to_hospital(
    hospital_id: int = Form(...),
    fee: int = Form(...),
    days_group: DaysGroup = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    patients_per_day: int = Form(...),
    document_1: UploadFile = File(...),
    document_2: UploadFile = File(...),
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    


    normalized_start = normalize_time_string(start_time)
    normalized_end = normalize_time_string(end_time)

    request_data = DoctorHospitalCreate(
        hospital_id=hospital_id,
        fee=fee,
        days_group=days_group,
        start_time=normalized_start,
        end_time=normalized_end,
        patients_per_day=patients_per_day,
    )

    document_1_bytes = await document_1.read()
    document_2_bytes = await document_2.read()

    return submit_doctor_hospital_request(
        request_data,
        document_1_bytes, document_1.filename,
        document_2_bytes, document_2.filename,
        current_doctor,
        db,
    )


@doctor_hospitals_router.get("/pending", response_model=PaginatedDoctorHospitalResponse)
def get_pending(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return list_pending_affiliations(db, skip=skip, limit=limit)


@doctor_hospitals_router.patch("/{affiliation_id}/approve", response_model=DoctorHospitalResponse)
def approve(
    affiliation_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return approve_affiliation(affiliation_id, background_tasks, db)


@doctor_hospitals_router.patch("/{affiliation_id}/reject", response_model=DoctorHospitalResponse)
def reject(
    affiliation_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return reject_affiliation(affiliation_id, background_tasks, db)


@doctor_hospitals_router.get("/my-applications", response_model=list[DoctorHospitalResponse])
def get_my_applications(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return list_my_affiliations(current_doctor.id, db)


@doctor_hospitals_router.patch("/{affiliation_id}/toggle-availability", response_model=DoctorHospitalResponse)
def toggle_availability_route(
    affiliation_id: int,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return toggle_availability(affiliation_id, current_doctor.id, db)


@doctor_hospitals_router.get("/{doctor_hospital_id}", response_model=DoctorHospitalPublicResponse)
def get_affiliation(
    doctor_hospital_id: int,
    db: Session = Depends(get_db),
):
    return get_public_affiliation(doctor_hospital_id, db)