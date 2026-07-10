from fastapi import APIRouter, Depends, Request, UploadFile, File
from sqlalchemy.orm import Session

from src.utils.database import get_db
from src.utils.limiter import limiter
from src.utils.helpers import get_current_admin
from src.admin.dtos import (
    AdminLogin, TokenResponse,
    CityCreate, CityResponse, CityUpdate,
    SpecializationCreate, SpecializationResponse, SpecializationUpdate,
    HospitalCreate, HospitalResponse, HospitalUpdate,
)
from src.admin.controller import (
    login_admin, create_city, create_specialization, create_hospital, upload_hospital_image,
    list_all_cities, update_city, delete_city,
    list_all_specializations, update_specialization, delete_specialization,
    list_all_hospitals, update_hospital, delete_hospital,
)

admin_router = APIRouter(prefix="/admin", tags=["Admin"])


@admin_router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, login_data: AdminLogin):
    return login_admin(login_data)


@admin_router.post("/cities", response_model=CityResponse)
def add_city(
    city_data: CityCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return create_city(city_data, db)


@admin_router.post("/specializations", response_model=SpecializationResponse)
def add_specialization(
    spec_data: SpecializationCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return create_specialization(spec_data, db)


@admin_router.post("/hospitals", response_model=HospitalResponse)
def add_hospital(
    hospital_data: HospitalCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return create_hospital(hospital_data, db)

@admin_router.post("/hospitals/{hospital_id}/upload-image", response_model=HospitalResponse)
async def upload_image(
    hospital_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    file_bytes = await file.read()
    return upload_hospital_image(hospital_id, file_bytes, file.filename, db)



@admin_router.get("/cities", response_model=list[CityResponse])
def get_cities(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    return list_all_cities(db)


@admin_router.patch("/cities/{city_id}", response_model=CityResponse)
def edit_city(
    city_id: int,
    update_data: CityUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return update_city(city_id, update_data, db)


@admin_router.delete("/cities/{city_id}")
def remove_city(
    city_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return delete_city(city_id, db)

@admin_router.get("/specializations", response_model=list[SpecializationResponse])
def get_specializations(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    return list_all_specializations(db)


@admin_router.patch("/specializations/{specialization_id}", response_model=SpecializationResponse)
def edit_specialization(
    specialization_id: int,
    update_data: SpecializationUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return update_specialization(specialization_id, update_data, db)


@admin_router.delete("/specializations/{specialization_id}")
def remove_specialization(
    specialization_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return delete_specialization(specialization_id, db)


@admin_router.get("/hospitals", response_model=list[HospitalResponse])
def get_hospitals(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    return list_all_hospitals(db)


@admin_router.patch("/hospitals/{hospital_id}", response_model=HospitalResponse)
def edit_hospital(
    hospital_id: int,
    update_data: HospitalUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return update_hospital(hospital_id, update_data, db)


@admin_router.delete("/hospitals/{hospital_id}")
def remove_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return delete_hospital(hospital_id, db)

