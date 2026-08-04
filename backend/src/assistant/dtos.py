from pydantic import BaseModel
from typing import List, Optional


class AssistantChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None


class AssistantChatResponse(BaseModel):
    reply: str
    possible_emergency: bool
    recommended_specializations: List[dict]
    recommended_doctors: List[dict]
    booked_appointments: List[dict]
    thread_id: str