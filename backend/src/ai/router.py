from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.utils.database import get_db
from src.utils.limiter import limiter
from src.ai.dtos import SymptomCheckRequest, SymptomCheckResponse
from src.ai.controller import check_symptoms

ai_router = APIRouter(prefix="/ai", tags=["AI"])


@ai_router.post("/symptom-check", response_model=SymptomCheckResponse)
@limiter.limit("10/minute")
def symptom_check(request: Request, data: SymptomCheckRequest, db: Session = Depends(get_db)):
    return check_symptoms(data.symptoms, db)