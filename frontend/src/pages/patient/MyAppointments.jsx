import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Card, Badge, Spinner, Button, TextArea, Alert, StarRating } from "../../components/ui";

const STATUS_TONE = { booked: "teal", completed: "marigold", cancelled: "coral" };
const PAYMENT_TONE = { pending: "coral", paid: "teal" };

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .get("/appointments/my", withAuth("patient"))
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  }

  if (loading) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">My appointments</h1>

      {appointments.length === 0 ? (
        <p className="mt-8 text-slate">You haven't booked any appointments yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          {appointments
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((appt) => (
              <AppointmentRow key={appt.id} appointment={appt} onReviewed={load} />
            ))}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({ appointment, onReviewed }) {
  const [showReview, setShowReview] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-5">
      <div
        className="flex cursor-pointer flex-wrap items-start justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="token-number text-xs text-slate">Token #{String(appointment.token_number).padStart(2, "0")}</p>
          <p className="font-display text-lg font-semibold text-ink">{appointment.patient_name}</p>
          <p className="text-sm text-slate">
            {appointment.appointment_date} · {appointment.start_time?.slice(0, 5)}–{appointment.end_time?.slice(0, 5)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={STATUS_TONE[appointment.status]}>{appointment.status}</Badge>
          <Badge tone={PAYMENT_TONE[appointment.payment_status]}>
            {appointment.payment_mode} · {appointment.payment_status}
          </Badge>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-light/20 pt-4 text-sm">
          <div>
            <p className="text-xs text-slate">Doctor</p>
            <p className="font-medium text-ink">Dr. {appointment.doctor_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Specialization</p>
            <p className="font-medium text-ink">{appointment.specialization_name}</p>
          </div>

          <div>
            <p className="text-xs text-slate">Time window</p>
            <p className="font-medium text-ink">
              {appointment.start_time?.slice(0, 5)}–{appointment.end_time?.slice(0, 5)}
            </p>
          </div>

          <div className="col-span-2">
            <p className="text-xs text-slate">Hospital</p>
            <p className="font-medium text-ink">{appointment.hospital_name}</p>
            {appointment.hospital_address && <p className="text-xs text-slate">{appointment.hospital_address}</p>}
          </div>
          {appointment.reason && (
            <div className="col-span-2">
              <p className="text-xs text-slate">Reason</p>
              <p className="text-ink">{appointment.reason}</p>
            </div>
          )}
        </div>
      )}

      {appointment.status === "completed" && (
        <div className="mt-4 border-t border-slate-light/20 pt-4">
          {appointment.has_review ? (
            <div>
              <p className="text-xs text-slate">Your review</p>
              <StarRating rating={appointment.review_rating} size={14} />
              {appointment.review_comment && (
                <p className="mt-1 text-sm text-ink/80">{appointment.review_comment}</p>
              )}
            </div>
          ) : showReview ? (
            <ReviewForm
              appointmentId={appointment.id}
              onDone={() => {
                setShowReview(false);
                onReviewed();
              }}
            />
          ) : (
            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setShowReview(true); }}>
              Leave a review
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function ReviewForm({ appointmentId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post(
        "/reviews",
        { appointment_id: appointmentId, rating, comment: comment || undefined },
        withAuth("patient")
      );
      onDone();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && <Alert>{error}</Alert>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)}>
            <svg width={22} height={22} viewBox="0 0 20 20" fill={n <= rating ? "#E8A233" : "#E4E9E7"}>
              <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L1.4 7.8l6-.8z" />
            </svg>
          </button>
        ))}
      </div>
      <TextArea
        placeholder="How was your visit? (optional)"
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}