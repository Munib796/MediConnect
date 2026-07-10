from pydantic import BaseModel
from typing import List


class SymptomCheckRequest(BaseModel):
    symptoms: str


class SymptomCheckResponse(BaseModel):
    specializations: List[dict]
    possible_emergency: bool
    note: str