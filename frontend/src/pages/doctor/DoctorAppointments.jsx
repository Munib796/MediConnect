import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Card, Badge, Spinner, Button, Alert } from "../../components/ui";

const STATUS_TONE = { booked: "teal", completed: "marigold", cancelled: "coral" };
const PAYMENT_TONE = { pending: "coral", paid: "teal" };

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .get("/appointments/doctor/my", withAuth("doctor"))
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  }

  async function markCompleted(id) {
    setCompletingId(id);
    setError("");
    try {
      await api.patch(`/appointments/${id}/complete`, {}, withAuth("doctor"));
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCompletingId(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  const sorted = [...appointments].sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Your appointments</h1>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {sorted.length === 0 ? (
        <p className="mt-8 text-slate">No appointments yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {sorted.map((appt) => (
            <Card key={appt.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="token-number text-xs text-slate">Token #{String(appt.token_number).padStart(2, "0")}</p>
                  <p className="font-display text-lg font-semibold text-ink">{appt.patient_name}</p>
                  <p className="text-sm text-slate">
                    {appt.appointment_date} · {appt.patient_age} yrs · {appt.patient_gender}
                  </p>
                  <p className="text-sm text-slate">{appt.hospital_name}</p>
                  {appt.hospital_address && <p className="text-xs text-slate">{appt.hospital_address}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge tone={STATUS_TONE[appt.status]}>{appt.status}</Badge>
                  <Badge tone={PAYMENT_TONE[appt.payment_status]}>
                    {appt.payment_mode} · {appt.payment_status}
                  </Badge>
                </div>
              </div>

              {appt.reason && <p className="mt-3 text-sm text-slate">{appt.reason}</p>}

              {appt.status === "booked" && (
                <div className="mt-4 border-t border-slate-light/20 pt-4">
                  {appt.payment_status === "paid" ? (
                    <Button
                      disabled={completingId === appt.id}
                      onClick={() => markCompleted(appt.id)}
                    >
                      {completingId === appt.id ? "Marking..." : "Mark as completed"}
                    </Button>
                  ) : (
                    <p className="text-sm text-slate">
                      Payment is still pending — this appointment can be marked completed once it's paid.
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
