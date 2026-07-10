from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.utils.database import get_db
from src.cities.dtos import CityResponse
from src.cities.controller import list_cities

cities_router = APIRouter(prefix="/cities", tags=["Cities"])


@cities_router.get("", response_model=list[CityResponse])
def get_cities(db: Session = Depends(get_db)):
    return list_cities(db)