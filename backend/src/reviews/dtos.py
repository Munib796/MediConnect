from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


class ReviewCreate(BaseModel):
    appointment_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_id: int
    patient_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime