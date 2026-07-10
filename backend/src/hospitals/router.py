from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from src.utils.database import get_db
from src.hospitals.dtos import HospitalListResponse, DoctorAtHospitalResponse, PaginatedHospitalResponse, PaginatedDoctorAtHospitalResponse
from src.hospitals.controller import list_hospitals, get_hospital_by_id, list_doctors_at_hospital

hospitals_router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@hospitals_router.get("", response_model=PaginatedHospitalResponse)
def get_hospitals(
    city_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return list_hospitals(db, city_id=city_id, search=search, skip=skip, limit=limit)


@hospitals_router.get("/{hospital_id}", response_model=HospitalListResponse)
def get_hospital(hospital_id: int, db: Session = Depends(get_db)):
    return get_hospital_by_id(hospital_id, db)


@hospitals_router.get("/{hospital_id}/doctors", response_model=PaginatedDoctorAtHospitalResponse)
def get_hospital_doctors(
    hospital_id: int,
    specialization_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return list_doctors_at_hospital(hospital_id, db, specialization_id=specialization_id, skip=skip, limit=limit)