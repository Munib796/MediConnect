from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from src.utils.settings import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_verification_email(email: str, token: str, role: str):
    verification_link = f"{settings.ORIGIN_URL}/{role}s/verify-email?token={token}"

    message = MessageSchema(
        subject="Verify your MediConnect account",
        recipients=[email],
        body=f"""
        <p>Welcome to MediConnect!</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_link}">Verify Email</a></p>
        <p>If you didn't create this account, you can ignore this email.</p>
        """,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_affiliation_status_email(email: str, doctor_name: str, hospital_name: str, status: str):
    subject = f"Your hospital affiliation request has been {status}"

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=f"""
        <p>Hi Dr. {doctor_name},</p>
        <p>Your affiliation request for <strong>{hospital_name}</strong> has been <strong>{status}</strong>.</p>
        {"<p>You are now live and bookable by patients at this hospital.</p>" if status == "approved" else "<p>If you believe this was a mistake, please contact support.</p>"}
        """,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)



async def send_booking_confirmation_email(
    email: str, patient_name: str, doctor_name: str, hospital_name: str, hospital_address: str,
    appointment_date: str, token_number: int
):
    message = MessageSchema(
        subject="Your MediConnect appointment is confirmed",
        recipients=[email],
        body=f"""
        <p>Hi {patient_name},</p>
        <p>Your appointment has been booked successfully.</p>
        <ul>
            <li><strong>Doctor:</strong> Dr. {doctor_name}</li>
            <li><strong>Hospital:</strong> {hospital_name}</li>
            <li><strong>Address:</strong> {hospital_address}</li>
            <li><strong>Date:</strong> {appointment_date}</li>
            <li><strong>Token Number:</strong> {token_number}</li>
        </ul>
        <p>Please arrive a little early on your appointment date.</p>
        """,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_password_reset_email(email: str, token: str, role: str):
    reset_link = f"{settings.ORIGIN_URL}/{role}s/reset-password?token={token}"

    message = MessageSchema(
        subject="Reset your MediConnect password",
        recipients=[email],
        body=f"""
        <p>We received a request to reset your password.</p>
        <p><a href="{reset_link}">Click here to reset your password</a></p>
        <p>If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
        """,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    await fm.send_message(message)