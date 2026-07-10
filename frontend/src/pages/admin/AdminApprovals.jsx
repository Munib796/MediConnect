import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Card, Badge, Button, Spinner, Alert } from "../../components/ui";
import { FileText } from "lucide-react";

const PAGE_SIZE = 10;

export default function AdminApprovals() {
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
      .get("/doctor-hospitals/pending", { params: { skip, limit: PAGE_SIZE }, ...withAuth("admin") })
      .then((res) => {
        setItems(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }

  async function act(id, action) {
    setError("");
    setActingId(id);
    try {
      await api.patch(`/doctor-hospitals/${id}/${action}`, {}, withAuth("admin"));
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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Pending approvals</h1>
      <p className="mt-1 text-sm text-slate">Review a doctor's documents before approving them at a hospital.</p>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {loading ? (
        <div className="flex justify-center py-16 text-teal"><Spinner /></div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-slate">No pending applications right now.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">Dr. {item.doctor_name}</p>
                  <p className="text-sm text-slate">{item.specialization_name} · {item.hospital_name}</p>
                </div>
                <Badge tone="marigold">{item.status}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate">Fee</p>
                  <p className="font-medium text-ink">Rs {item.fee}</p>
                </div>
                <div>
                  <p className="text-xs text-slate">Days</p>
                  <p className="font-medium text-ink">{item.days?.join(", ")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate">Hours</p>
                  <p className="font-medium text-ink">
                    {item.start_time?.slice(0, 5)}–{item.end_time?.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate">Capacity/day</p>
                  <p className="font-medium text-ink">{item.patients_per_day}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-4 text-sm">
                <a
                  href={item.document_1_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-teal hover:underline"
                >
                  <FileText size={14} /> Document 1
                </a>
                <a
                  href={item.document_2_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-teal hover:underline"
                >
                  <FileText size={14} /> Document 2
                </a>
              </div>

              <div className="mt-4 flex gap-3">
                <Button disabled={actingId === item.id} onClick={() => act(item.id, "approve")}>
                  {actingId === item.id ? "Working..." : "Approve"}
                </Button>
                <Button variant="danger" disabled={actingId === item.id} onClick={() => act(item.id, "reject")}>
                  Reject
                </Button>
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
