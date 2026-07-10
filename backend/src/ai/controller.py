from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.specializations.models import Specialization
from src.utils.ai_client import suggest_specializations

EMERGENCY_NOTE = (
    "This may be a medical emergency. Please contact emergency services or go to the "
    "nearest emergency room immediately rather than booking a routine appointment."
)
NORMAL_NOTE = (
    "This is a suggestion only, not a medical diagnosis. Please consult the doctor for an accurate assessment."
)

NO_MATCH_NOTE = (
    "We couldn't match this to a specialization currently offered on MediConnect. "
    "Try describing your symptoms differently, or browse hospitals directly."
)

def check_symptoms(symptoms: str, db: Session) -> dict:
    if not symptoms or not symptoms.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please describe your symptoms.")

    all_specializations = db.query(Specialization).all()
    names = [s.name for s in all_specializations]

    try:
        result = suggest_specializations(symptoms.strip(), names)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Couldn't reach the symptom checker right now: {str(e)}",
        )

    # Cross-check the model's output against the real DB list (case-insensitive) so a
    # hallucinated or slightly-off name can never leak into the response.
    name_lookup = {s.name.lower(): s for s in all_specializations}
    matched = []
    for suggested_name in result.get("specializations", []):
        match = name_lookup.get(suggested_name.strip().lower())
        if match:
            matched.append({"id": match.id, "name": match.name})

    possible_emergency = bool(result.get("possible_emergency", False))

    if possible_emergency:
        note = EMERGENCY_NOTE
    elif not matched:
        note = NO_MATCH_NOTE
    else:
        note = NORMAL_NOTE

    return {
        "specializations": matched,
        "possible_emergency": possible_emergency,
        "note": note,
    }