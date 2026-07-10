import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { toBackendDate, todayIso, maxBookingIso } from "../../lib/date";
import { Button, Input, Select, TextArea, Alert, StarRating, Spinner } from "../../components/ui";
import TicketStub from "../../components/TicketStub";

export default function BookAppointment() {
  const { doctorHospitalId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(location.state?.doctor || null);
  const [doctorLoading, setDoctorLoading] = useState(!location.state?.doctor);
  const [doctorNotFound, setDoctorNotFound] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({
    appointment_date: todayIso(),
    patient_name: "",
    patient_age: "",
    patient_gender: "Male",
    contact_phone: "",
    reason: "",
    payment_mode: "cash",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  // If we weren't handed the doctor via router state (refresh, shared link,
  // an odd redirect chain), fall back to fetching it directly.
  useEffect(() => {
    if (doctor || !doctorHospitalId) return;
    api
      .get(`/doctor-hospitals/${doctorHospitalId}`)
      .then((res) => setDoctor(res.data))
      .catch(() => setDoctorNotFound(true))
      .finally(() => setDoctorLoading(false));
  }, [doctor, doctorHospitalId]);

  useEffect(() => {
    if (doctor) {
      api.get(`/reviews/doctor/${doctor.doctor_id}`).then((res) => setReviews(res.data)).catch(() => {});
    }
  }, [doctor]);

  if (doctorLoading) {
    return (
      <div className="flex justify-center py-24 text-teal">
        <Spinner />
      </div>
    );
  }

  if (!doctor || doctorNotFound) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-slate">
          We lost track of which doctor you meant to book. Please go back and pick one again.
        </p>
        <Link to="/hospitals" className="mt-4 inline-block font-medium text-teal">
          Browse hospitals
        </Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        doctor_hospital_id: parseInt(doctorHospitalId, 10),
        appointment_date: toBackendDate(form.appointment_date),
        patient_name: form.patient_name,
        patient_age: parseInt(form.patient_age, 10),
        patient_gender: form.patient_gender,
        contact_phone: form.contact_phone,
        reason: form.reason || undefined,
        payment_mode: form.payment_mode,
      };
      const res = await api.post("/appointments", payload, withAuth("patient"));
      const appointment = res.data;

      if (form.payment_mode === "online") {
        const payRes = await api.post(
          `/appointments/${appointment.id}/pay`,
          {},
          withAuth("patient")
        );
        window.location.href = payRes.data.checkout_url;
        return;
      }

      setConfirmed(appointment);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="mb-8 text-center font-display text-2xl font-semibold text-ink">Appointment confirmed</h1>
        <TicketStub
          appointment={confirmed}
          doctorName={doctor.doctor_name}
          hospitalName={doctor.hospital_name}
          hospitalAddress={doctor.hospital_address}
        />
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => navigate("/my-appointments")}>View my appointments</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-teal-light">
              {doctor.profile_image_url && (
                <img src={doctor.profile_image_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-ink">Dr. {doctor.doctor_name}</h1>
              <p className="text-sm text-slate">{doctor.specialization_name}</p>
            </div>
          </div>

          {doctor.hospital_name && (
            <div className="mt-4 flex items-start gap-1.5 text-sm text-ink">
              <MapPin size={15} className="mt-0.5 shrink-0 text-teal" />
              <div>
                <p className="font-medium">{doctor.hospital_name}</p>
                {doctor.hospital_address && <p className="text-xs text-slate">{doctor.hospital_address}</p>}
              </div>
            </div>
          )}

          <p className="mt-4 text-sm text-slate">{doctor.bio}</p>

          <div className="ticket-stub mt-6 p-5">
            <p className="text-xs text-slate">Consultation Fee</p>
            <p className="token-number text-2xl font-semibold text-teal-dark">Rs {doctor.fee}</p>
            <div className="ticket-divider my-3" />
            <p className="text-xs text-slate">Available</p>
            <p className="text-sm font-medium text-ink">
              {doctor.days?.join(", ")} · {doctor.start_time?.slice(0, 5)}–{doctor.end_time?.slice(0, 5)}
            </p>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-base font-semibold text-ink">Patient reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-sm text-slate-light">No reviews yet.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-light/30 bg-white p-3">
                    <StarRating rating={r.rating} size={13} />
                    {r.comment && <p className="mt-1 text-sm text-ink/80">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="md:col-span-3">
          <div className="rounded-2xl border border-slate-light/30 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Book this appointment</h2>
            <p className="mt-1 text-sm text-slate">You can book for yourself or a family member.</p>

            {error && <div className="mt-4"><Alert>{error}</Alert></div>}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Appointment date"
                type="date"
                min={todayIso()}
                max={maxBookingIso()}
                value={form.appointment_date}
                onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                required
              />
              <Input
                label="Patient name"
                value={form.patient_name}
                onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                placeholder="Who is this visit for?"
                required
              />
              <Input
                label="Age"
                type="number"
                min="0"
                value={form.patient_age}
                onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
                required
              />
              <Select
                label="Gender"
                value={form.patient_gender}
                onChange={(e) => setForm({ ...form, patient_gender: e.target.value })}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
              <Input
                label="Contact phone"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                placeholder="03xxxxxxxxx"
                inputMode="numeric"
                pattern="\d{11}"
                title="Enter exactly 11 digits"
                required
                className="sm:col-span-2"
              />
              <TextArea
                label="Reason for visit (optional)"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-sm font-medium text-ink">Payment method</span>
              <div className="grid grid-cols-2 gap-3">
                <PaymentOption
                  label="Cash"
                  sub="Pay at the hospital"
                  active={form.payment_mode === "cash"}
                  onClick={() => setForm({ ...form, payment_mode: "cash" })}
                />
                <PaymentOption
                  label="Online"
                  sub="Pay now by card"
                  active={form.payment_mode === "online"}
                  onClick={() => setForm({ ...form, payment_mode: "online" })}
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="mt-6 w-full justify-center">
              {submitting ? <Spinner /> : "Confirm booking"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentOption({ label, sub, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition-colors ${
        active ? "border-teal bg-teal-light" : "border-slate-light/40 bg-white"
      }`}
    >
      <p className="font-semibold text-ink">{label}</p>
      <p className="text-xs text-slate">{sub}</p>
    </button>
  );
}