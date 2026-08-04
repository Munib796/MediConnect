import { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Card, Badge, Button, Spinner, Alert } from "../../components/ui";
import { StatusPill } from "../../components/QueueTracker";
import ConfirmDialog from "../../components/ConfirmDialog";
import { usePageTitle } from "../../lib/usePageTitle";

const PAGE_SIZE = 15;
const PAYMENT_TONE = { pending: "coral", paid: "sage" };

export default function AdminAppointments() {
  usePageTitle("All Appointments");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

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

  async function confirmDelete() {
    const id = pendingDelete;
    setError("");
    setActingId(id);
    try {
      await api.delete(`/appointments/${id}`, withAuth("admin"));
      setPendingDelete(null);
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
        <Card className="mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light text-teal">
            <CalendarX size={26} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">No appointments yet</p>
            <p className="mt-1 text-sm text-slate">Bookings across all hospitals will appear here.</p>
          </div>
        </Card>
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
                <StatusPill status={appt.status} />
                <Badge tone={PAYMENT_TONE[appt.payment_status]} dot>
                  {appt.payment_mode} · {appt.payment_status}
                </Badge>

                {appt.payment_mode === "cash" && appt.payment_status === "pending" && (
                  <Button variant="outline" disabled={actingId === appt.id} onClick={() => markPaid(appt.id)}>
                    Mark paid
                  </Button>
                )}
                {appt.status === "booked" && (
                  <Button variant="danger" disabled={actingId === appt.id} onClick={() => setPendingDelete(appt.id)}>
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete appointment?"
        message="This permanently removes the booking and frees the token. This can't be undone."
        confirmLabel="Delete"
        loading={actingId !== null && actingId === pendingDelete}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
