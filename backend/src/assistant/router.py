from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session

from src.utils.database import get_db
from src.utils.limiter import limiter
from src.utils.helpers import get_current_patient
from src.patients.models import Patient
from src.assistant.dtos import AssistantChatRequest, AssistantChatResponse
from src.assistant.controller import chat_with_assistant

assistant_router = APIRouter(prefix="/assistant", tags=["Assistant"])


@assistant_router.post("/chat", response_model=AssistantChatResponse)
@limiter.limit("15/minute")
def chat(
    request: Request,
    data: AssistantChatRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient),
):
    return chat_with_assistant(data.message, data.thread_id, current_patient, db, background_tasks)