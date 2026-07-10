from pydantic import BaseModel, ConfigDict
from typing import Optional


class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    province: Optional[str] = None