"""
Patient AI Assistant.

Architecture: Supervisor -> (Symptom Agent | Search Agent | General Response)

Phase 1: supervisor + symptom agent.
Phase 2 (this update): adds a Search Agent -- a small tool-calling sub-agent
that can look up doctors, hospitals, and a doctor's full profile, using your
EXISTING controller functions (src.doctors.controller.search_doctors,
src.hospitals.controller.list_hospitals, src.doctor_hospitals.controller.
get_public_affiliation). The search agent never queries the DB directly
itself -- it calls the same functions your real /doctors/search,
/hospitals, and /doctor-hospitals/{id} endpoints already use, so results are
always real, never invented.

"AI decides what to do next. Backend decides what is allowed."
"""
from typing import Annotated, Literal, TypedDict

from fastapi import HTTPException, BackgroundTasks
from datetime import date, datetime
from langchain.agents import create_agent
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
import re

from src.utils.settings import settings
from src.utils.ai_client import suggest_specializations
from src.specializations.models import Specialization
from src.cities.models import City
from src.hospitals.models import Hospital
from src.doctors.controller import search_doctors
from src.hospitals.controller import list_hospitals
from src.doctor_hospitals.controller import get_public_affiliation
from src.appointments.controller import (
    check_appointment_availability,
    book_appointment,
    get_my_appointments,
    initiate_online_payment,
    get_appointment_payment_status,
)
from src.appointments.dtos import AppointmentCreate, AppointmentResponse
from src.patients.models import Patient
from pydantic import ValidationError as PydanticValidationError


def _extract_text(content) -> str:
    """ChatGoogleGenerativeAI can return content as a plain string OR as a
    list of content blocks (e.g. [{'type': 'text', 'text': '...'}]) depending
    on the response format Gemini uses. Normalize either shape to plain text
    so it always fits our str-typed response fields."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
            elif isinstance(block, str):
                parts.append(block)
        return "".join(parts)
    return str(content)


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------
class AssistantState(TypedDict):
    messages: Annotated[list, add_messages]
    intent: str | None
    possible_emergency: bool | None
    recommended_specializations: list | None
    recommended_doctors: list | None
    booked_appointments: list | None


# ---------------------------------------------------------------------------
# Supervisor: classifies intent only. Now has 4 possible routes.
# ---------------------------------------------------------------------------
class IntentClassification(BaseModel):
    intent: Literal["symptom", "search", "appointment", "general"] = Field(
        description=(
            "'symptom' if the patient is describing a health symptom or asking what kind "
            "of doctor/specialist they should see (not naming a specific doctor or city). "
            "'search' if the patient is asking to find/search for doctors or hospitals -- "
            "this includes narrow requests like 'find a dermatologist in Karachi' AND broad, "
            "no-criteria requests like 'show me all doctors', 'what doctors do you have', "
            "'list available doctors/hospitals' -- also use 'search' for asking about a "
            "specific doctor's profile/fee/hours/reviews. "
            "'appointment' if the patient wants to check availability, book an appointment, "
            "confirm a booking, see their existing appointments, or ask about payment status "
            "or a payment link for a booking. "
            "'general' for greetings, small talk, or anything else not covered above."
        )
    )

_classifier_model = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=settings.GEMINI_API_KEY,
).with_structured_output(IntentClassification)


def supervisor_node(state: AssistantState) -> dict:
    # Give the classifier real conversation context, not just the isolated
    # last message. A message like "John, 24, male, 03001234567, cash" is
    # meaningless taken alone -- but it obviously continues a booking flow if
    # the assistant's previous message just asked for exactly those details.
    # Classifying on the last message only was letting these continuation
    # messages fall through to 'general' intent unpredictably, which has no
    # tools and no anti-hallucination guardrails at all.
    recent_messages = state["messages"][-6:]
    context_lines = []
    for m in recent_messages:
        role = "Patient" if isinstance(m, HumanMessage) else "Assistant"
        context_lines.append(f"{role}: {_extract_text(m.content)}")
    context_text = "\n".join(context_lines)

    classification = _classifier_model.invoke(
        "Here is the recent conversation (most recent message last):\n\n"
        f"{context_text}\n\n"
        "Classify the intent of the PATIENT's most recent message above. Use the "
        "conversation context to understand what it's continuing -- e.g. if the "
        "assistant's previous message asked for booking details and this message "
        "provides them (even just a name, age, phone number, or payment mode), that is "
        "'appointment' intent, not 'general', even though the message alone has no verb."
    )
    # These fields describe what happened on THIS turn, not the whole
    # conversation -- reset them here so a symptom/search/booking result from
    # an earlier turn doesn't leak into a later, unrelated reply.
    return {
        "intent": classification.intent,
        "possible_emergency": False,
        "recommended_specializations": [],
        "recommended_doctors": [],
        "booked_appointments": [],
    }


def route_from_supervisor(state: AssistantState) -> Literal["symptom_agent", "search_agent", "appointment_agent", "general_response"]:
    if state["intent"] == "symptom":
        return "symptom_agent"
    if state["intent"] == "search":
        return "search_agent"
    if state["intent"] == "appointment":
        return "appointment_agent"
    return "general_response"


# ---------------------------------------------------------------------------
# Symptom agent (Phase 1, unchanged)
# ---------------------------------------------------------------------------
EMERGENCY_NOTE = (
    "This may be a medical emergency. Please contact emergency services or go to the "
    "nearest emergency room immediately rather than booking a routine appointment."
)
NORMAL_NOTE = (
    "This is a suggestion only, not a medical diagnosis. Please consult the doctor for an accurate assessment."
)
NO_MATCH_NOTE = (
    "I couldn't match this to a specialization currently offered on MediConnect. "
    "Try describing your symptoms differently, or browse hospitals directly."
)


def symptom_agent_node(state: AssistantState, config) -> dict:
    db = config["configurable"]["db"]
    symptoms = state["messages"][-1].content

    all_specializations = db.query(Specialization).all()
    names = [s.name for s in all_specializations]

    result = suggest_specializations(symptoms, names)

    name_lookup = {s.name.lower(): s for s in all_specializations}
    matched = []
    for suggested_name in result.get("specializations", []):
        match = name_lookup.get(suggested_name.strip().lower())
        if match:
            matched.append({"id": match.id, "name": match.name})

    possible_emergency = bool(result.get("possible_emergency", False))

    if possible_emergency:
        reply = EMERGENCY_NOTE
    elif not matched:
        reply = NO_MATCH_NOTE
    else:
        spec_names = ", ".join(m["name"] for m in matched)
        reply = f"Based on what you've described, you may want to see a {spec_names} specialist. {NORMAL_NOTE}"

    return {
        "messages": [AIMessage(content=reply)],
        "possible_emergency": possible_emergency,
        "recommended_specializations": matched,
    }


# ---------------------------------------------------------------------------
# Search agent (Phase 2, new): a small tool-calling sub-agent with 3 tools,
# all backed by your existing controller functions.
# ---------------------------------------------------------------------------
SEARCH_SYSTEM_PROMPT = """You are the MediConnect doctor/hospital search assistant.

You MUST use your tools to answer -- never invent doctor names, hospitals, fees, or \
ratings. If a tool returns no results, say so plainly instead of guessing.

If the patient asks to see all/any available doctors, or doesn't have a specific city \
or specialization in mind, call search_doctors_tool with NO filters (or just a limit) -- \
do not refuse or claim you have no way to list doctors. This tool supports browsing \
with no filters at all.

If the patient asks about a specific doctor by name (e.g. "search for Dr. Basit", "is \
Dr. Ahmed available"), ALWAYS use the doctor_name parameter of search_doctors_tool -- \
this does a real name search and will find them even if there are many doctors in the \
system. Never say you don't have a way to search by name, and never try to browse and \
guess from a limited list instead.

NEVER show the patient a doctor's numeric doctor_hospital_id. It is for your own \
internal bookkeeping across this conversation only (e.g. so a later booking step can \
refer back to a specific listing). When talking to the patient, always refer to a \
doctor by name and hospital, e.g. "Dr. Sahar at Agha Khan Hospital" -- never write \
"(ID: 15)" or similar in anything shown to them.

Keep responses concise and easy to scan."""


def _build_search_agent(db):
    """Tools are rebuilt per-request because they close over the current
    request's DB session -- the session's lifetime is owned by the FastAPI
    request (via get_db), not by the graph, so we never cache it globally."""

    # Collected as a side effect of tool calls, so we can return STRUCTURED
    # doctor results to the frontend (not just prose) -- useful now, and
    # will let Phase 3's booking step reference a doctor_hospital_id without
    # re-searching.
    collected_doctors: list[dict] = []

    # Ground the agent in the REAL specialization names in your DB (e.g.
    # "Dermatologist", not "Dermatology") -- same principle as the symptom
    # checker: don't let the LLM guess terminology that might not match.
    real_specialization_names = [s.name for s in db.query(Specialization).all()]
    specialization_hint = (
        ", ".join(real_specialization_names) if real_specialization_names else "none configured"
    )

    @tool
    def search_doctors_tool(city: str = "", specialization: str = "", doctor_name: str = "", hospital: str = "", limit: int = 5) -> str:
        """Search MediConnect for approved, available doctors. city, specialization,
        doctor_name, and hospital are ALL OPTIONAL and can be combined. Call with no
        arguments at all to browse/list doctors generally. Use doctor_name for "search
        for Dr. X" style requests -- this does a real database name search (partial
        match, e.g. doctor_name='Basit' matches 'Dr. Basit Ali'), so ALWAYS use this
        parameter for name searches instead of trying to browse and guess from a limited
        list. Use hospital to disambiguate when the same doctor name appears at more
        than one hospital. Increase limit (max 10) if the patient asks to see more
        results. Returns matches with doctor name, hospital, fee, rating, and each
        listing's doctor_hospital_id."""
        city_id = None
        if city:
            city_row = db.query(City).filter(City.name.ilike(city.strip())).first()
            city_id = city_row.id if city_row else None

        specialization_id = None
        if specialization:
            spec_row = db.query(Specialization).filter(
                Specialization.name.ilike(specialization.strip())
            ).first()
            specialization_id = spec_row.id if spec_row else None

        capped_limit = max(1, min(limit, 10))
        result = search_doctors(
            db,
            city_id=city_id,
            specialization_id=specialization_id,
            doctor_name=doctor_name.strip() or None,
            hospital_name=hospital.strip() or None,
            skip=0,
            limit=capped_limit,
        )
        if not result["items"]:
            return "No doctors found matching that search."

        collected_doctors.extend(result["items"])

        lines = []

        lines = []
        for item in result["items"]:
            lines.append(
                f"doctor_hospital_id={item['doctor_hospital_id']} | Dr. {item['doctor_name']} "
                f"({item['specialization_name']}) at {item['hospital_name']} | "
                f"Fee: PKR {item['fee']} | Rating: {item['avg_rating']} ({item['review_count']} reviews)"
            )
        return "\n".join(lines)

    @tool
    def list_cities_tool() -> str:
        """List all cities where MediConnect currently has hospitals/doctors listed.
        Use this whenever the patient asks which cities/locations you serve, or asks to
        browse by city but hasn't named one -- never guess or infer this from doctors
        you happen to remember from earlier in the conversation."""
        cities = (
            db.query(City)
            .join(Hospital, Hospital.city_id == City.id)
            .distinct()
            .order_by(City.name)
            .all()
        )
        if not cities:
            return "No cities currently have listings."
        return ", ".join(c.name for c in cities)

    @tool
    def search_hospitals_tool(city: str = "") -> str:
        """Search MediConnect for hospitals, optionally filtered by city name."""
        city_id = None
        if city:
            city_row = db.query(City).filter(City.name.ilike(f"%{city.strip()}%")).first()
            city_id = city_row.id if city_row else None

        result = list_hospitals(db, city_id=city_id, skip=0, limit=5)
        if not result["items"]:
            return "No hospitals found matching that search."

        lines = [f"{h.name} | {h.address}" for h in result["items"]]
        return "\n".join(lines)

    @tool
    def get_doctor_profile_tool(doctor_hospital_id: int) -> str:
        """Get full profile details (qualifications, experience, bio, fee, hours,
        rating) for one specific doctor-hospital listing, using the doctor_hospital_id
        from search_doctors_tool results."""
        try:
            profile = get_public_affiliation(doctor_hospital_id, db)
        except HTTPException as e:
            return f"Could not find that listing: {e.detail}"

        collected_doctors.append(profile)

        return (
            f"Dr. {profile['doctor_name']} ({profile['specialization_name']})\n"
            f"Qualifications: {profile['qualifications']}\n"
            f"Experience: {profile['experience_years']} years\n"
            f"Bio: {profile['bio']}\n"
            f"Hospital: {profile['hospital_name']}, {profile['hospital_address']}\n"
            f"Fee: PKR {profile['fee']} | Days: {profile['days']} | "
            f"Hours: {profile['start_time']}-{profile['end_time']}\n"
            f"Rating: {profile['avg_rating']} ({profile['review_count']} reviews)"
        )

    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", google_api_key=settings.GEMINI_API_KEY)
    agent = create_agent(
        model=model,
        tools=[list_cities_tool, search_doctors_tool, search_hospitals_tool, get_doctor_profile_tool],
        system_prompt=f"{SEARCH_SYSTEM_PROMPT}\n\nThe exact specializations currently offered on "
                       f"MediConnect are: {specialization_hint}. Always use one of these exact names "
                       f"when calling search_doctors_tool -- never a generic medical term.",
    )
    return agent, collected_doctors


def search_agent_node(state: AssistantState, config) -> dict:
    db = config["configurable"]["db"]
    agent, collected_doctors = _build_search_agent(db)

    result = agent.invoke({"messages": state["messages"]})
    reply_text = _extract_text(result["messages"][-1].content)

    # Dedupe by doctor_hospital_id in case both search + profile tools ran.
    seen = set()
    deduped = []
    for d in collected_doctors:
        key = d.get("doctor_hospital_id")
        if key not in seen:
            seen.add(key)
            deduped.append(d)

    return {
        "messages": [AIMessage(content=reply_text)],
        "recommended_doctors": deduped,
    }

# Booking appointment Agent
# ---------------------------------------------------------------------------
# Appointment agent (Phase 3, new): checks availability and books
# appointments using your EXISTING controller functions. Booking only
# happens when the tool is called with patient_confirmed=True, which the
# system prompt requires the agent to only set after the patient has
# explicitly confirmed a shown summary -- a soft guardrail on top of the
# backend's own hard validation (dates, capacity, weekday, affiliation
# status), which can never be bypassed regardless of what the LLM does.
APPOINTMENT_SYSTEM_PROMPT = """You are the MediConnect appointment booking assistant.

Today's date is {today}. When the patient says a relative date like "tomorrow" or \
"next Monday", convert it yourself to DD-MM-YYYY before calling a tool.

CRITICAL RULE -- NEVER INVENT DOCTORS OR AVAILABILITY: if the patient mentions a doctor \
by name (with or without a hospital/specialization), you do NOT know who that is until \
you call find_doctor_tool. NEVER assume, guess, or invent a doctor_hospital_id, \
hospital name, fee, or availability for a doctor you haven't looked up. This applies \
even on the very first message of a conversation. If find_doctor_tool finds nothing, \
say so honestly -- do not make something up that sounds plausible. If find_doctor_tool finds nothing for a name the patient gave, don't just repeat a flat \
apology. Respond warmly, and if you don't already know the specialization they want, ask \
for it. Once you have a specialization, call find_doctor_tool again with that \
specialization (no name) to offer real alternatives who ARE in the system. Only offer \
alternatives find_doctor_tool actually returns -- never invent one, and never claim a \
doctor exists just because the patient insists.

CRITICAL RULE -- NEVER CLAIM TO HAVE RECHECKED WITHOUT ACTUALLY CALLING A TOOL: if the \
patient asks you to double check, recheck, or verify something, you MUST actually call \
the relevant tool again and report its real result. Never say "I have rechecked" or "I \
confirm this is correct" unless you just made a real tool call this turn that supports \
that statement.

find_doctor_tool's results include the doctor's available days and hours -- use that \
directly to answer questions about availability/timings. Never say you don't have \
access to timings; read it from your last find_doctor_tool call instead.

CRITICAL RULE -- NEVER SHOW RAW IDS TO THE PATIENT: doctor_hospital_id numbers are for \
your own internal tool calls only. When talking to the patient, always refer to a \
doctor by name and hospital (e.g. "Dr. Sahar at Agha Khan Hospital"), never by their \
numeric id. Do not write things like "(ID: 15)" or "doctor_hospital_id 15" in anything \
shown to the patient. Patients search by name/specialization/hospital, not ids -- never \
ask them to provide an id either.

CRITICAL RULE: if the patient is asking a QUESTION -- e.g. "did you book it", "is my \
appointment confirmed", "what have you booked for me" -- you MUST use \
get_my_appointments_tool to check and answer honestly. NEVER call \
create_appointment_tool in response to a question. Only call it in response to an \
explicit, freshly confirmed booking request.

Workflow you must follow:
1. If the patient mentions a doctor by name and you don't already have their real \
doctor_hospital_id from earlier in this conversation, call find_doctor_tool FIRST \
before anything else -- before discussing availability, fees, or days. If more than \
one listing matches, ask the patient to clarify using hospital names.
2. Call check_availability_tool to confirm the date works BEFORE proposing a booking.
3. Always explicitly ask whose name and phone number the booking should be under -- is \
it for the patient themselves, or someone else (e.g. a relative)? NEVER assume or \
silently reuse the logged-in patient's own details without asking first. Get an actual \
name and an actual 11-digit phone number from the conversation.
4. Show the patient a clear summary (doctor, hospital, date, fee, reason for visit but it is optional, \
payment mode: cash or online, patient name, phone number) and explicitly ask them to confirm the details are \
correct.
5. If the patient only confirms the DETAILS are correct (e.g. says "correct", "that's \
right", "looks good", "yes those are right") WITHOUT explicitly telling you to proceed \
with booking, do NOT call create_appointment_tool yet. Instead ask a separate, distinct \
follow-up question such as "Great -- shall I go ahead and book this now?" Only call \
create_appointment_tool with patient_confirmed=True after the patient gives an explicit \
go-ahead to book (e.g. "yes book it", "go ahead", "proceed", "book it now") in response \
to THAT specific question. Confirming accuracy and confirming intent to book are two \
separate steps -- never treat one as satisfying the other.
6. You also need patient_age, patient_gender,reason for visit but it is optional so don't block booking on it, and payment_mode ('cash' or 'online') -- ask for whichever of these you don't have yet.
7. If payment_mode is 'online', a payment link is generated and included automatically \
in the booking confirmation -- you do not need to call a separate tool for that.
8. If the patient asks about payment status later, or wants a fresh payment link for an \
older appointment, use check_payment_status_tool or create_stripe_checkout_tool with \
that appointment's id (from get_my_appointments_tool).
9. If create_appointment_tool reports a duplicate already exists, tell the patient \
plainly and do not retry -- trust the tool's answer.

Never invent availability, fees, booking confirmations, payment links, or payment \
statuses -- only report what the tools actually return. Never say an appointment is \
booked unless a tool call actually returned a real confirmation."""

# ---------------------------------------------------------------------------
# Fallback verification: if the appointment agent claims a doctor "couldn't
# be found" without having actually called find_doctor_tool this turn (the
# LLM narrating an outcome with nothing behind it -- the same failure family
# as the fake booking-success claims, just inverted), we don't trust that
# claim. Instead we extract what the patient was likely asking about and
# perform a REAL lookup ourselves at the code level, then use that real
# result -- never the model's own unverified words -- for the final reply.
# ---------------------------------------------------------------------------
class DoctorQueryExtraction(BaseModel):
    doctor_name: str | None = Field(default=None, description="Doctor's name mentioned, without titles like 'Dr.'. None if no name is mentioned.")
    specialization: str | None = Field(default=None, description="Specialization mentioned, if any. None if not mentioned.")
    hospital: str | None = Field(default=None, description="Specific HOSPITAL name mentioned, if any (e.g. 'Ziauddin', 'Agha Khan'). Do NOT put a city name here.")
    city: str | None = Field(default=None, description="CITY name mentioned, if any (e.g. 'Karachi', 'Lahore'). Do NOT put a hospital name here.")


_doctor_query_extractor = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=settings.GEMINI_API_KEY,
).with_structured_output(DoctorQueryExtraction)


def _build_appointment_agent(db, patient: Patient, background_tasks: BackgroundTasks):
    """Tools close over the current request's db session, the authenticated
    patient, and the request's BackgroundTasks (used for the existing
    booking-confirmation email) -- none of these are cached globally, since
    they're all tied to this one request's lifecycle."""

    booked_appointments: list[dict] = []

    # Every call to find_doctor_tool (found OR not-found) records the raw
    # ITEMS found (empty list = not found). We deliberately store structured
    # data here, not the pre-formatted text returned to the LLM -- that text
    # includes raw internal ids that must never be shown to the patient
    # verbatim if we need to override the LLM's reply.
    lookup_attempts: list[list[dict]] = []

    @tool
    def find_doctor_tool(doctor_name: str = "", specialization: str = "", hospital: str = "", city: str = "") -> str:
        """Look up a real doctor listing by name, specialization, hospital, and/or city
        (all optional, combine as needed). ALWAYS call this to resolve a doctor the
        patient mentions by name (e.g. "Dr. Sahar", "Dr. Atif Chauhan at Agha Khan")
        before checking availability or booking -- NEVER assume or invent a
        doctor_hospital_id, hospital, or fee. If the same name matches more than one
        listing (e.g. the same doctor at different hospitals), ask the patient which
        hospital they mean using hospital NAMES, not ids. Returns real doctor name,
        hospital, fee, and each listing's doctor_hospital_id."""
        city_id = None
        if city:
            city_row = db.query(City).filter(City.name.ilike(city.strip())).first()
            city_id = city_row.id if city_row else None

        specialization_id = None
        if specialization:
            spec_row = db.query(Specialization).filter(
                Specialization.name.ilike(specialization.strip())
            ).first()
            specialization_id = spec_row.id if spec_row else None

        result = search_doctors(
            db,
            city_id=city_id,
            specialization_id=specialization_id,
            doctor_name=doctor_name.strip() or None,
            hospital_name=hospital.strip() or None,
            skip=0,
            limit=10,
        )
        lookup_attempts.append(result["items"])

        if not result["items"]:
            return "No matching doctor found."

        lines = []
        for item in result["items"]:
            lines.append(
                f"doctor_hospital_id={item['doctor_hospital_id']} | Dr. {item['doctor_name']} "
                f"({item['specialization_name']}) at {item['hospital_name']}, {item['city_name']} "
                f"({item['hospital_address']}) | Fee: PKR {item['fee']} | "
                f"Available: {item['days']}, {item['start_time']}-{item['end_time']}"
            )
        return "\n".join(lines)

    @tool
    def check_availability_tool(doctor_hospital_id: int, appointment_date: str) -> str:
        """Check whether a date (format DD-MM-YYYY, e.g. 15-08-2026) is bookable for a
        given doctor_hospital_id, WITHOUT booking anything. Returns the fee and
        confirmation it's available, or the specific reason it isn't (wrong weekday,
        fully booked, too far in advance, etc)."""
        try:
            parsed_date = datetime.strptime(appointment_date.strip(), "%d-%m-%Y").date()
        except ValueError:
            return "Invalid date format. Please use DD-MM-YYYY, e.g. 15-08-2026."

        result = check_appointment_availability(db, doctor_hospital_id, parsed_date)
        if result["available"]:
            return (
                f"Available. Fee: PKR {result['fee']}. This would be token number "
                f"{result['would_be_token']} for {appointment_date}."
            )
        return f"Not available: {result['reason']}"

# Every call to create_appointment_tool (success OR failure) records its
    # own literal return string here. This is the ground truth for whether a
    # booking action happened this turn -- appointment_agent_node uses THIS
    # text as the outcome the patient sees, instead of trusting the LLM's own
    # paraphrase, which has repeatedly claimed success when nothing actually
    # happened.
    booking_attempts: list[str] = []

    def _create_appointment_impl(
        doctor_hospital_id: int,
        appointment_date: str,
        patient_age: int,
        patient_gender: str,
        payment_mode: str,
        patient_confirmed: bool,
        patient_name: str,
        contact_phone: str,
        reason: str = "",
    ) -> str:
        if not patient_confirmed:
            return (
                "I need to confirm the details with you before booking. Please review "
                "the summary above and let me know if it's correct and you'd like to proceed."
            )

        try:
            parsed_date = datetime.strptime(appointment_date.strip(), "%d-%m-%Y").date()
        except ValueError:
            return "Invalid date format. Please use DD-MM-YYYY, e.g. 15-08-2026."

        # Hard guard against accidental duplicate bookings -- e.g. the agent
        # being asked a status question and mistakenly re-booking instead of
        # checking. Never silently create a second appointment for the same
        # patient, same doctor listing, same date, same name.
        for a in get_my_appointments(patient, db):
            if (
                a.doctor_hospital_id == doctor_hospital_id
                and a.appointment_date == parsed_date
                and a.patient_name.strip().lower() == patient_name.strip().lower()
                and a.status.value != "cancelled"
            ):
                return (
                    f"Not booked -- you already have an appointment (token #{a.token_number}, "
                    f"status: {a.status.value}) for this doctor on this date under this name. "
                    f"I won't create a duplicate appointment. If you are booking for your "
                    f"relatives or anyone so provide their name please."
                )

        try:
            booking_data = AppointmentCreate(
                doctor_hospital_id=doctor_hospital_id,
                appointment_date=appointment_date,
                patient_name=patient_name.strip(),
                patient_age=patient_age,
                patient_gender=patient_gender,
                contact_phone=contact_phone.strip(),
                reason=reason or None,
                payment_mode=payment_mode,
            )
        except PydanticValidationError as e:
            bad_fields = ", ".join(sorted({str(err["loc"][0]) for err in e.errors()}))
            return f"Could not book: please double-check these details: {bad_fields}."

        try:
            appointment = book_appointment(booking_data, background_tasks, patient, db)
        except HTTPException as e:
            return f"Could not book: {e.detail}"

        appointment_data = AppointmentResponse.model_validate(appointment).model_dump()

        if booking_data.payment_mode.value == "cash":
            pay_note = "Please pay at the hospital."
            appointment_data["checkout_url"] = None
        else:
            try:
                checkout_url = initiate_online_payment(appointment.id, patient, db)
                pay_note = f"Please complete your payment here to confirm your slot: {checkout_url}"
                appointment_data["checkout_url"] = checkout_url
            except HTTPException as e:
                pay_note = (
                    f"Your appointment is booked, but I couldn't generate a payment link right now "
                    f"({e.detail}). Please use the regular payment page on the site, or ask me to "
                    f"try again."
                )
                appointment_data["checkout_url"] = None

        booked_appointments.append(appointment_data)

        return (
            f"Booked! Token number {appointment.token_number} for {appointment_date} "
            f"with Dr. {appointment.doctor_name} at {appointment.hospital_name}. {pay_note}"
        )

    @tool
    def create_appointment_tool(
        doctor_name: str,
        hospital_name: str,
        appointment_date: str,
        patient_age: int,
        patient_gender: str,
        payment_mode: str,
        patient_confirmed: bool,
        patient_name: str,
        contact_phone: str,
        reason: str = "",
    ) -> str:
        """Actually book the appointment. Identify the doctor by doctor_name AND
        hospital_name exactly as confirmed with the patient -- this tool re-resolves the
        real listing itself, so you never need to remember or pass a numeric id.
        patient_confirmed MUST be True -- only set it True if the patient has explicitly
        confirmed a summary you showed them, which MUST include whose name and phone
        number the booking is under (never silently assume it's the logged-in patient --
        always ask). payment_mode must be exactly 'cash' or 'online'. patient_name and
        contact_phone are REQUIRED -- get them from the conversation, never leave them
        blank or guess."""
        # Resolve fresh, right now -- never trust an id the model tried to carry in its
        # own memory across turns, which has produced intermittent false failures/wrong
        # bookings even with a single unambiguous listing.
        match = search_doctors(
            db,
            doctor_name=doctor_name.strip() or None,
            hospital_name=hospital_name.strip() or None,
            skip=0,
            limit=5,
        )
        if not match["items"]:
            return (
                f"Could not book: no listing found for Dr. {doctor_name} at "
                f"{hospital_name}. Re-search before trying again."
            )
        if len(match["items"]) > 1:
            return (
                f"Could not book: more than one listing matches Dr. {doctor_name} at "
                f"{hospital_name} -- ask the patient to clarify the exact hospital."
            )
        resolved_doctor_hospital_id = match["items"][0]["doctor_hospital_id"]

        result_text = _create_appointment_impl(
            doctor_hospital_id=resolved_doctor_hospital_id,
            appointment_date=appointment_date,
            patient_age=patient_age,
            patient_gender=patient_gender,
            payment_mode=payment_mode,
            patient_confirmed=patient_confirmed,
            patient_name=patient_name,
            contact_phone=contact_phone,
            reason=reason,
        )
        booking_attempts.append(result_text)
        return result_text

    @tool
    def get_my_appointments_tool() -> str:
        """List the patient's own appointments (past and upcoming), with status,
        payment status, doctor, hospital, and token number."""
        appointments = get_my_appointments(patient, db)
        if not appointments:
            return "You have no appointments yet."
        lines = []
        for a in appointments:
            lines.append(
                f"#{a.id} | {a.appointment_date.strftime('%d-%m-%Y')} | Dr. {a.doctor_name} "
                f"at {a.hospital_name} | Token {a.token_number} | Status: {a.status.value} | "
                f"Payment: {a.payment_status.value} ({a.payment_mode.value})"
            )
        return "\n".join(lines)

    @tool
    def check_payment_status_tool(appointment_id: int) -> str:
        """Check the current payment status (paid/pending) and mode (cash/online) for
        one of the patient's own appointments, using its appointment id (from
        get_my_appointments_tool)."""
        try:
            result = get_appointment_payment_status(appointment_id, patient, db)
        except HTTPException as e:
            return f"Could not check: {e.detail}"
        return (
            f"Appointment #{result['appointment_id']}: payment mode is "
            f"{result['payment_mode']}, status is {result['payment_status']}. Fee: PKR {result['fee']}."
        )

    @tool
    def create_stripe_checkout_tool(appointment_id: int) -> str:
        """Generate a fresh Stripe payment link for one of the patient's own EXISTING
        online-payment appointments (e.g. their previous link expired, or they want to
        pay now for an appointment booked earlier). Only works if payment_mode is
        'online' and it isn't already paid."""
        try:
            checkout_url = initiate_online_payment(appointment_id, patient, db)
        except HTTPException as e:
            return f"Could not generate a payment link: {e.detail}"
        return f"Here's your payment link: {checkout_url}"

    @tool
    def list_cities_tool() -> str:
        """List all cities where MediConnect currently has hospitals/doctors listed.
        Use this if the patient asks which cities/locations you serve -- never guess or
        infer this from doctors you happen to remember from earlier in the conversation."""
        cities = (
            db.query(City)
            .join(Hospital, Hospital.city_id == City.id)
            .distinct()
            .order_by(City.name)
            .all()
        )
        if not cities:
            return "No cities currently have listings."
        return ", ".join(c.name for c in cities)

    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", google_api_key=settings.GEMINI_API_KEY)
    agent = create_agent(
        model=model,
        tools=[
            find_doctor_tool,
            check_availability_tool,
            create_appointment_tool,
            get_my_appointments_tool,
            check_payment_status_tool,
            create_stripe_checkout_tool,
            list_cities_tool,
        ],
        system_prompt=APPOINTMENT_SYSTEM_PROMPT.format(today=date.today().strftime("%d-%m-%Y")),
    )
    return agent, booked_appointments, booking_attempts, lookup_attempts

def _format_doctor_items_for_patient(items: list[dict]) -> str:
    """The ONLY function allowed to turn a doctor lookup result into text a
    patient sees. Never shows ids, never includes tool-internal formatting
    -- just name, specialization, hospital, fee, and availability."""
    if not items:
        return (
            "I couldn't find a matching doctor. Could you double-check the name, "
            "hospital, or specialization?"
        )
    lines = []
    for i in items:
        line = f"Dr. {i['doctor_name']} ({i['specialization_name']}) at {i['hospital_name']} -- Fee: PKR {i['fee']}"
        if i.get("days") and i.get("start_time") and i.get("end_time"):
            line += f" | Available: {i['days']}, {i['start_time']}-{i['end_time']}"
        lines.append(line)
    if len(items) > 1:
        return "I found more than one match:\n" + "\n".join(lines) + "\n\nWhich one would you like?"
    return "I found this doctor:\n" + lines[0] + "\n\nWould you like to proceed with booking?"

def appointment_agent_node(state: AssistantState, config) -> dict:
    db = config["configurable"]["db"]
    patient = config["configurable"]["patient"]
    background_tasks = config["configurable"]["background_tasks"]

    agent, booked_appointments, booking_attempts, lookup_attempts = _build_appointment_agent(db, patient, background_tasks)
    result = agent.invoke({"messages": state["messages"]})
    reply_text = _extract_text(result["messages"][-1].content)
    recommended_doctors: list = []

    if booking_attempts:
        # A real create_appointment_tool call happened THIS turn -- whether
        # it succeeded, hit the duplicate guard, or failed validation, its
        # own literal return string is the ground truth for what happened.
        # We use that directly instead of the LLM's paraphrase, since the
        # LLM has repeatedly claimed success in its own words even when the
        # tool clearly said otherwise (or wasn't the source of the claim at
        # all). Use the LAST attempt in case of retries within one turn.
        reply_text = booking_attempts[-1]
    else:
        # No booking tool call happened at all this turn. This is a broader,
        # imperfect safety net for the rarer case where the LLM claims
        # success with literally no related tool call behind it -- keyword
        # matching can't catch every phrasing, but it's better than nothing.
        claims_success = any(
            phrase in reply_text.lower()
            for phrase in [
                "successfully booked",
                "booked!",
                "your appointment is booked",
                "appointment is confirmed",
                "your appointment is confirmed",
                "i have booked",
                "i've booked",
                "confirmed your appointment",
            ]
        )
        if claims_success:
            reply_text = (
                "Sorry -- I need to correct myself. Your appointment was NOT actually "
                "booked. Please tell me again which doctor, which date, and confirm "
                "you'd like to book, and I'll try again properly."
            )

    # Mirror image of the above: the model has also repeatedly claimed a
    # doctor "couldn't be found" without ever actually calling
    # find_doctor_tool this turn -- especially after a couple of genuine
    # not-found results earlier in the conversation, it seems to anchor on
    # that outcome and stop trying. We never trust an unverified negative
    # claim either -- if find_doctor_tool WAS called this turn, its own
    # return text is ground truth (same principle as booking_attempts). If
    # it was NOT called at all, we perform a real lookup ourselves before
    # accepting the claim.
    _NOT_FOUND_RE = re.compile(
        r"(?i)(unable to (find|locate)|couldn'?t (find|locate)|could not (find|locate)|"
        r"don'?t have (a |that )?listing|do not have (a |that )?listing|no matching doctor|"
        r"not able to locate|no doctor (named|by the name))"
    )
    claims_not_found = bool(_NOT_FOUND_RE.search(reply_text))
    # Mirror image of the negative case: the model can also fabricate a
    # confident REVERSAL ("I can see him now", "you're right") with zero
    # find_doctor_tool call behind it this turn. Only flag reversal-style
    # language here -- not every reply mentioning "Dr." or "PKR" -- so
    # normal steps later in the flow (showing a summary, confirming a fee
    # for an already-resolved doctor) aren't falsely re-triggered.
    claims_reversal = not lookup_attempts and any(
        phrase in reply_text.lower()
        for phrase in [
            "i can see", "i can now see", "you're right", "you are right",
            "actually have", "on file now", "let me recheck", "i was wrong",
            "rechecked", "retrieved the full profile", "have since retrieved",
            "now have access",
        ]
    )
    # Ground truth for THIS turn, if a real lookup happened.
    tool_found = bool(lookup_attempts) and bool(lookup_attempts[-1])
    tool_not_found = bool(lookup_attempts) and not tool_found

    # Only override the model's own phrasing when it CONTRADICTS what
    # really happened this turn -- not just because the topic is "not
    # found" at all (so an already-correct, naturally worded "not found"
    # reply isn't clobbered with the blunt raw tool string).
    mismatch = (
        (claims_not_found and tool_found)
        or (claims_reversal and tool_not_found)
        or ((claims_not_found or claims_reversal) and not lookup_attempts)
    )

    if mismatch:
        if lookup_attempts:
            # A real lookup happened -- trust its actual result over the
            # model's paraphrase (it may have found real results and still
            # claimed failure, which has happened before). Always rebuild
            # the message via the shared formatter -- never show the tool's
            # raw internal text (ids) directly to the patient.
            items = lookup_attempts[-1]
            reply_text = _format_doctor_items_for_patient(items)
            if items:
                recommended_doctors = items
        else:
            # No lookup happened at all -- verify for real before accepting
            # the claim. Use recent conversation context, not just the last
            # message -- a follow-up like "at Ziauddin hospital" has no
            # doctor name in it if "Basit" was said a turn or two earlier.
            recent = state["messages"][-6:]
            context_text = "\n".join(
                f"{'Patient' if isinstance(m, HumanMessage) else 'Assistant'}: {_extract_text(m.content)}"
                for m in recent
            )

            extraction = _doctor_query_extractor.invoke(
                f"From this conversation, extract the doctor name, specialization, "
                f"hospital name, and city (if any) the patient is currently asking about. "
                f"A city (e.g. Karachi, Lahore) is NOT a hospital name -- keep them separate:\n\n{context_text}"
            )

            specialization_id = None
            if extraction.specialization:
                spec_row = db.query(Specialization).filter(
                    Specialization.name.ilike(f"%{extraction.specialization.strip()}%")
                ).first()
                specialization_id = spec_row.id if spec_row else None

            city_id = None
            if extraction.city:
                city_row = db.query(City).filter(City.name.ilike(extraction.city.strip())).first()
                city_id = city_row.id if city_row else None

            verify = search_doctors(
                db,
                city_id=city_id,
                specialization_id=specialization_id,
                doctor_name=(extraction.doctor_name or "").strip() or None,
                hospital_name=(extraction.hospital or "").strip() or None,
                skip=0,
                limit=10,
            )

            if verify["items"]:
                recommended_doctors = verify["items"]
                if claims_not_found:
                    reply_text = "Sorry, I need to correct myself -- I actually do have this on file.\n\n" + _format_doctor_items_for_patient(verify["items"])
                else:
                    reply_text = _format_doctor_items_for_patient(verify["items"])
            elif claims_reversal:
                # The model claimed a reversal but a real check still finds
                # nothing -- don't let the fabricated positive stand.
                reply_text = "I'm not finding a matching doctor for that. Could you double-check the name or hospital?"
            # else (claims_not_found, verify also empty): original not-found
            # reply stands -- it's now a genuinely confirmed negative.

    return {
        "messages": [AIMessage(content=reply_text)],
        "booked_appointments": booked_appointments,
        "recommended_doctors": recommended_doctors,
    }

# ---------------------------------------------------------------------------
# General response
# ---------------------------------------------------------------------------
GENERAL_SYSTEM_PROMPT = """You are the MediConnect Patient Assistant, a friendly \
helper on a doctor appointment booking platform in Pakistan.

You can help with: understanding symptoms and suggesting what type of specialist to \
see, finding/searching doctors and hospitals, checking appointment availability, \
booking appointments, viewing a patient's existing appointments, and payments -- when \
an appointment is booked with online payment, a real Stripe payment link is generated \
and included automatically as part of the booking confirmation. Patients can also ask \
to check payment status or get a fresh payment link for an existing appointment.

Keep replies short and warm. You are not a doctor and must never diagnose."""

_chat_model = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=settings.GEMINI_API_KEY,
)


def general_response_node(state: AssistantState) -> dict:
    response = _chat_model.invoke([SystemMessage(GENERAL_SYSTEM_PROMPT)] + state["messages"])
    reply_text = _extract_text(response.content)

    # This node has NO booking tools at all -- it is structurally impossible
    # for a real booking to have happened here. So if the model's free text
    # claims one anyway (the exact failure mode that happens when the
    # classifier misroutes a booking-continuation message to 'general'),
    # that claim is always false and must be overridden.
    claims_success = any(
        phrase in reply_text.lower()
        for phrase in [
            "successfully booked",
            "booked!",
            "your appointment is booked",
            "appointment is confirmed",
            "your appointment is confirmed",
            "i have booked",
            "i've booked",
            "confirmed your appointment",
        ]
    )
    if claims_success:
        reply_text = (
            "Sorry -- I need to correct myself. No appointment was actually booked. "
            "Let's go through this properly: which doctor, which date, and your booking "
            "details, and I'll confirm before finalizing anything."
        )

    return {"messages": [AIMessage(content=reply_text)]}


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------
def build_graph():
    builder = StateGraph(AssistantState)
    builder.add_node("supervisor", supervisor_node)
    builder.add_node("symptom_agent", symptom_agent_node)
    builder.add_node("search_agent", search_agent_node)
    builder.add_node("appointment_agent", appointment_agent_node)
    builder.add_node("general_response", general_response_node)

    builder.add_edge(START, "supervisor")
    builder.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        {
            "symptom_agent": "symptom_agent",
            "search_agent": "search_agent",
            "appointment_agent": "appointment_agent",
            "general_response": "general_response",
        },
    )
    builder.add_edge("symptom_agent", END)
    builder.add_edge("search_agent", END)
    builder.add_edge("appointment_agent", END)
    builder.add_edge("general_response", END)

    return builder.compile(checkpointer=InMemorySaver())


assistant_graph = build_graph()