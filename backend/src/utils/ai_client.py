import json
from google import genai
from google.genai import types

from src.utils.settings import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)

SYSTEM_INSTRUCTION = """You are a triage assistant for MediConnect, a doctor appointment booking platform in Pakistan.
Given a patient's described symptoms and a fixed list of medical specializations available on the platform,
identify the 1 to 3 specializations most likely relevant to those symptoms.

Rules:
- Only return specialization names that appear EXACTLY in the provided list. Never invent a specialization that isn't in the list.
- If nothing in the list is a reasonable match, return an empty list.
- If the symptoms described sound like a medical emergency (e.g. chest pain with breathlessness, severe bleeding,
  signs of stroke, loss of consciousness), set "possible_emergency" to true.
- You are not diagnosing. You are only helping the patient pick which type of doctor to search for.
"""


def suggest_specializations(symptoms: str, available_specializations: list[str]) -> dict:
    response = _client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=f"Available specializations: {available_specializations}\n\nPatient's description: {symptoms}",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema={
                "type": "object",
                "properties": {
                    "specializations": {"type": "array", "items": {"type": "string"}},
                    "possible_emergency": {"type": "boolean"},
                },
                "required": ["specializations", "possible_emergency"],
            },
        ),
    )
    return json.loads(response.text)