from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from fastapi.middleware.cors import CORSMiddleware
from src.utils.settings import settings

from src.utils.database import Base, engine
from src.utils.limiter import limiter

from src.cities.models import City
from src.specializations.models import Specialization
from src.hospitals.models import Hospital
from src.doctors.models import Doctor
from src.doctor_hospitals.models import DoctorHospital
from src.patients.models import Patient
from src.appointments.models import Appointment
from src.reviews.models import Review

from src.patients.router import patients_router
from src.doctors.router import doctors_router
from src.admin.router import admin_router
from src.doctor_hospitals.router import doctor_hospitals_router
from src.hospitals.router import hospitals_router
from src.appointments.router import appointments_router
from src.reviews.router import reviews_router
from src.cities.router import cities_router
from src.specializations.router import specializations_router
from src.ai.router import ai_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MediConnect")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ORIGIN_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients_router)
app.include_router(doctors_router)
app.include_router(admin_router)
app.include_router(doctor_hospitals_router)
app.include_router(hospitals_router)
app.include_router(appointments_router)
app.include_router(reviews_router)
app.include_router(cities_router)
app.include_router(specializations_router)
app.include_router(ai_router)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)



@app.get("/")
async def read_root():
    return {"status": "MediConnect API is running"}