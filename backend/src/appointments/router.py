from fastapi import APIRouter, Depends, BackgroundTasks, Request, Query
from sqlalchemy.orm import Session

from src.utils.database import get_db
from src.utils.helpers import get_current_patient, get_current_doctor, get_current_admin
from src.patients.models import Patient
from src.doctors.models import Doctor
from src.appointments.dtos import AppointmentCreate, AppointmentResponse, CheckoutSessionResponse, PaginatedAppointmentResponse
from src.utils.limiter import limiter
from src.appointments.controller import (
    book_appointment,
    get_my_appointments,
    get_doctor_appointments,
    mark_appointment_completed,
    get_all_appointments,
    delete_appointment,
    initiate_online_payment,
    handle_stripe_webhook,
    mark_cash_payment_paid,
)

appointments_router = APIRouter(prefix="/appointments", tags=["Appointments"])


@appointments_router.post("", response_model=AppointmentResponse)
@limiter.limit("10/minute")
def create_appointment(
    request: Request,
    booking_data: AppointmentCreate,
    background_tasks: BackgroundTasks,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return book_appointment(booking_data, background_tasks, current_patient, db)


@appointments_router.post("/{appointment_id}/pay", response_model=CheckoutSessionResponse)
def pay_online(
    appointment_id: int,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    checkout_url = initiate_online_payment(appointment_id, current_patient, db)
    return CheckoutSessionResponse(checkout_url=checkout_url)


@appointments_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    return handle_stripe_webhook(payload, sig_header, db)


@appointments_router.patch("/{appointment_id}/mark-cash-paid", response_model=AppointmentResponse)
def mark_cash_paid(
    appointment_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return mark_cash_payment_paid(appointment_id, db)


@appointments_router.get("/my", response_model=list[AppointmentResponse])
def my_appointments(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return get_my_appointments(current_patient, db)


@appointments_router.get("/doctor/my", response_model=list[AppointmentResponse])
def doctor_appointments(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return get_doctor_appointments(current_doctor.id, db)


@appointments_router.patch("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: int,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return mark_appointment_completed(appointment_id, current_doctor.id, db)


@appointments_router.get("/admin/all", response_model=PaginatedAppointmentResponse)
def all_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return get_all_appointments(db, skip=skip, limit=limit)


@appointments_router.delete("/{appointment_id}")
def remove_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    return delete_appointment(appointment_id, db)