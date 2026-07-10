from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.utils.database import get_db
from src.specializations.dtos import SpecializationResponse
from src.specializations.controller import list_specializations

specializations_router = APIRouter(prefix="/specializations", tags=["Specializations"])


@specializations_router.get("", response_model=list[SpecializationResponse])
def get_specializations(db: Session = Depends(get_db)):
    return list_specializations(db)