import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Ticket } from "lucide-react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import { Card, Badge, Spinner, Button, TextArea, Alert, StarRating } from "../../components/ui";
import QueueTracker, { StatusPill } from "../../components/QueueTracker";

const PAYMENT_TONE = { pending: "coral", paid: "sage" };

export default function MyAppointments() {
  usePageTitle("My Appointments");
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

  const sorted = [...appointments].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  const counts = {
    booked: appointments.filter((a) => a.status === "booked").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    total: appointments.length,
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">My appointments</h1>
          <p className="mt-1 text-sm text-slate">Track your tokens and manage your visits.</p>
        </div>
        <Link to="/hospitals">
          <Button variant="outline" className="text-sm">
            <CalendarPlus size={16} /> Book another
          </Button>
        </Link>
      </div>

      {appointments.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light text-teal">
            <Ticket size={26} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">No appointments yet</p>
            <p className="mt-1 text-sm text-slate">
              Find a verified doctor and reserve your first token in minutes.
            </p>
          </div>
          <Link to="/hospitals">
            <Button>Find a doctor</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* At-a-glance summary */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <SummaryStat label="Upcoming" value={counts.booked} tone="teal" />
            <SummaryStat label="Completed" value={counts.completed} tone="sage" />
            <SummaryStat label="Total" value={counts.total} tone="slate" />
          </div>

          <div className="mt-6 flex flex-col gap-5">
            {sorted.map((appt) => (
              <AppointmentRow key={appt.id} appointment={appt} onReviewed={load} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value, tone }) {
  const tones = {
    teal: "text-teal",
    sage: "text-sage",
    slate: "text-slate",
  };
  return (
    <Card className="p-4 text-center">
      <p className={`token-number text-3xl font-bold ${tones[tone]}`}>
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
    </Card>
  );
}

function AppointmentRow({ appointment, onReviewed }) {
  const [showReview, setShowReview] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const needsPayment = appointment.payment_mode === "online" && appointment.payment_status === "pending";

  async function handlePayNow(e) {
    e.stopPropagation();
    setPayLoading(true);
    setPayError("");
    try {
      const res = await api.post(`/appointments/${appointment.id}/pay`, {}, withAuth("patient"));
      window.open(res.data.checkout_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setPayError(extractErrorMessage(err));
    } finally {
      setPayLoading(false);
    }
  }

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
          <StatusPill status={appointment.status} />
          <Badge tone={PAYMENT_TONE[appointment.payment_status]} dot>
            {appointment.payment_mode} · {appointment.payment_status}
          </Badge>
          {needsPayment && (
            <Button variant="accent" className="px-4 py-1.5 text-xs" disabled={payLoading} onClick={handlePayNow}>
              {payLoading ? <Spinner /> : "Pay now"}
            </Button>
          )}
        </div>
      </div>

      {/* Live queue tracker — only meaningful while the visit is still upcoming */}
      {appointment.status === "booked" && (
        <div className="mt-4">
          <QueueTracker appointment={appointment} />
        </div>
      )}

      {payError && (
        <div className="mt-3">
          <Alert tone="coral">{payError}</Alert>
        </div>
      )}

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