from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
from langchain_core.messages import HumanMessage

from src.assistant.graph import assistant_graph
from src.patients.models import Patient


def chat_with_assistant(
    message: str,
    thread_id: str | None,
    patient: Patient,
    db: Session,
    background_tasks: BackgroundTasks,
) -> dict:
    if not message or not message.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please enter a message.")

    resolved_thread_id = thread_id or f"patient-{patient.id}"

    config = {
        "configurable": {
            "thread_id": resolved_thread_id,
            "db": db,
            "patient": patient,
            "background_tasks": background_tasks,
        }
    }

    try:
        result = assistant_graph.invoke(
            {"messages": [HumanMessage(content=message.strip())]},
            config=config,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Couldn't reach the assistant right now: {str(e)}",
        )

    return {
        "reply": result["messages"][-1].content,
        "possible_emergency": bool(result.get("possible_emergency", False)),
        "recommended_specializations": result.get("recommended_specializations") or [],
        "recommended_doctors": result.get("recommended_doctors") or [],
        "booked_appointments": result.get("booked_appointments") or [],
        "thread_id": resolved_thread_id,
    }