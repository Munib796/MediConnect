import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Card, Badge, Button, Spinner, Alert } from "../../components/ui";

const PAGE_SIZE = 15;
const STATUS_TONE = { booked: "teal", completed: "marigold", cancelled: "coral" };
const PAYMENT_TONE = { pending: "coral", paid: "teal" };

export default function AdminAppointments() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    load();
  }, [skip]);

  function load() {
    setLoading(true);
    api
      .get("/appointments/admin/all", { params: { skip, limit: PAGE_SIZE }, ...withAuth("admin") })
      .then((res) => {
        setItems(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }

  async function markPaid(id) {
    setError("");
    setActingId(id);
    try {
      await api.patch(`/appointments/${id}/mark-cash-paid`, {}, withAuth("admin"));
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this appointment? This can't be undone.")) return;
    setError("");
    setActingId(id);
    try {
      await api.delete(`/appointments/${id}`, withAuth("admin"));
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActingId(null);
    }
  }

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">All appointments</h1>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {loading ? (
        <div className="flex justify-center py-16 text-teal"><Spinner /></div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-slate">No appointments yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {items.map((appt) => (
            <Card key={appt.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="token-number text-xs text-slate">
                  Token #{String(appt.token_number).padStart(2, "0")} · {appt.appointment_date}
                </p>
                <p className="font-medium text-ink">{appt.patient_name} with Dr. {appt.doctor_name}</p>
                <p className="text-xs text-slate">
                  {appt.hospital_name}
                  {appt.hospital_address ? ` · ${appt.hospital_address}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[appt.status]}>{appt.status}</Badge>
                <Badge tone={PAYMENT_TONE[appt.payment_status]}>
                  {appt.payment_mode} · {appt.payment_status}
                </Badge>

                {appt.payment_mode === "cash" && appt.payment_status === "pending" && (
                  <Button variant="outline" disabled={actingId === appt.id} onClick={() => markPaid(appt.id)}>
                    Mark paid
                  </Button>
                )}
                {appt.status === "booked" && (
                  <Button variant="danger" disabled={actingId === appt.id} onClick={() => handleDelete(appt.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button variant="outline" disabled={page <= 1} onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}>
            Previous
          </Button>
          <span className="text-sm text-slate">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setSkip(skip + PAGE_SIZE)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
