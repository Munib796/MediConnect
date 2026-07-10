from fastapi import HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from datetime import date, timedelta
from sqlalchemy import func

from src.appointments.models import Appointment, AppointmentStatus, PaymentStatus
from src.appointments.dtos import AppointmentCreate
from src.doctor_hospitals.models import DoctorHospital, AffiliationStatus
from src.patients.models import Patient
from src.utils.mails import send_booking_confirmation_email
from src.utils.stripe_client import create_checkout_session
from src.utils.settings import settings
import stripe


WEEKDAY_MAP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MAX_BOOKING_DAYS_AHEAD = 10


def book_appointment(booking_data: AppointmentCreate, background_tasks: BackgroundTasks, current_patient: Patient, db: Session) -> Appointment:
    affiliation = db.query(DoctorHospital).filter(
        DoctorHospital.id == booking_data.doctor_hospital_id
    ).first()
    if not affiliation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor-hospital affiliation not found.")

    if affiliation.status != AffiliationStatus.approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This doctor is not currently bookable at this hospital.")

    if not affiliation.is_available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This doctor is currently marked unavailable at this hospital.")

    today = date.today()
    if booking_data.appointment_date < today:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot book an appointment in the past.")

    max_date = today + timedelta(days=MAX_BOOKING_DAYS_AHEAD)
    if booking_data.appointment_date > max_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Appointments can only be booked up to {MAX_BOOKING_DAYS_AHEAD} days in advance (latest date: {max_date}).",
        )

    weekday_name = WEEKDAY_MAP[booking_data.appointment_date.weekday()]
    if weekday_name not in affiliation.days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Doctor is not available on {weekday_name}. Available days: {affiliation.days}.",
        )


    same_day_filter = [
        Appointment.doctor_hospital_id == booking_data.doctor_hospital_id,
        Appointment.appointment_date == booking_data.appointment_date,
        Appointment.status.in_([AppointmentStatus.booked, AppointmentStatus.completed]),
    ]

    existing_count = db.query(Appointment).filter(*same_day_filter).count()

    if existing_count >= affiliation.patients_per_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No slots available for this doctor on the selected date. Please choose a different date.",
        )

    max_token = db.query(func.max(Appointment.token_number)).filter(*same_day_filter).scalar() or 0
    token_number = max_token + 1
    
    appointment = Appointment(
        patient_id=current_patient.id,
        doctor_hospital_id=booking_data.doctor_hospital_id,
        appointment_date=booking_data.appointment_date,
        token_number=token_number,
        patient_name=booking_data.patient_name,
        patient_age=booking_data.patient_age,
        patient_gender=booking_data.patient_gender,
        contact_phone=booking_data.contact_phone,
        reason=booking_data.reason,
        status=AppointmentStatus.booked,
        payment_mode=booking_data.payment_mode.value,
        payment_status=PaymentStatus.pending,
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    background_tasks.add_task(
        send_booking_confirmation_email,
        current_patient.email,
        booking_data.patient_name,
        appointment.doctor_hospital.doctor.name,
        appointment.doctor_hospital.hospital.name,
        appointment.doctor_hospital.hospital.address,
        booking_data.appointment_date.strftime("%d-%m-%Y"),
        appointment.token_number,
    )

    return appointment


def get_my_appointments(current_patient: Patient, db: Session) -> list:
    return db.query(Appointment).filter(
        Appointment.patient_id == current_patient.id
    ).all()


def get_doctor_appointments(current_doctor_id: int, db: Session) -> list:
    return db.query(Appointment).join(DoctorHospital).filter(
        DoctorHospital.doctor_id == current_doctor_id
    ).all()


def mark_appointment_completed(appointment_id: int, current_doctor_id: int, db: Session) -> Appointment:
    appointment = db.query(Appointment).join(DoctorHospital).filter(
        Appointment.id == appointment_id,
        DoctorHospital.doctor_id == current_doctor_id,
    ).first()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if appointment.status != AppointmentStatus.booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot mark as completed, appointment is already {appointment.status.value}.",
        )
    
    if appointment.payment_status != PaymentStatus.paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot mark as completed until payment has been received.",
        )


    appointment.status = AppointmentStatus.completed
    
    db.commit()
    db.refresh(appointment)

    return appointment


def get_all_appointments(db: Session, skip: int = 0, limit: int = 20) -> dict:
    query = db.query(Appointment)
    total = query.count()
    items = query.order_by(Appointment.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "skip": skip, "limit": limit, "items": items}


def delete_appointment(appointment_id: int, db: Session) -> dict:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if appointment.status != AppointmentStatus.booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only booked (not yet completed) appointments can be deleted.",
        )

    db.delete(appointment)
    db.commit()

    return {"message": "Appointment deleted successfully."}

# 

def initiate_online_payment(appointment_id: int, current_patient: Patient, db: Session) -> str:
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.patient_id == current_patient.id,
    ).first()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if appointment.payment_mode != "online":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This appointment is not set for online payment.")

    if appointment.payment_status == PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This appointment is already paid.")

    fee = appointment.doctor_hospital.fee

    session_id, checkout_url = create_checkout_session(
        appointment_id=appointment.id,
        fee=fee,
        success_url=f"{settings.ORIGIN_URL}/payment-success",
        cancel_url=f"{settings.ORIGIN_URL}/payment-cancelled",
    )

    appointment.stripe_session_id = session_id
    db.commit()

    return checkout_url

# stripe.Webhook.construct_event(...) verifies the request genuinely came from Stripe (using the signature header + your STRIPE_WEBHOOK_SECRET),
#  not from someone pretending to be Stripe and hitting your endpoint directly to fake a "payment succeeded" event 

def handle_stripe_webhook(payload: bytes, sig_header: str, db: Session) -> dict:
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature.")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        appointment_id = appointment_id = session.metadata["appointment_id"]

        if appointment_id:
            appointment = db.query(Appointment).filter(Appointment.id == int(appointment_id)).first()
            if appointment:
                appointment.payment_status = PaymentStatus.paid
                db.commit()

    return {"status": "success"}


def mark_cash_payment_paid(appointment_id: int, db: Session) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if appointment.payment_mode != "cash":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This appointment is not set for cash payment.")

    if appointment.payment_status == PaymentStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This appointment is already marked as paid.")

    appointment.payment_status = PaymentStatus.paid
    db.commit()
    db.refresh(appointment)

    return appointment