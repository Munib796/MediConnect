import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Card, Badge, Spinner, Button, Alert } from "../../components/ui";

const STATUS_TONE = { pending: "marigold", approved: "teal", rejected: "coral" };

export default function DoctorApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .get("/doctor-hospitals/my-applications", withAuth("doctor"))
      .then((res) => setApplications(res.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  async function toggleAvailability(id) {
    setTogglingId(id);
    setError("");
    try {
      await api.patch(`/doctor-hospitals/${id}/toggle-availability`, {}, withAuth("doctor"));
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">My applications</h1>
        <Link to="/doctor/apply">
          <Button variant="accent"><Plus size={16} /> Apply to a hospital</Button>
        </Link>
      </div>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {applications.length === 0 ? (
        <p className="mt-8 text-slate">You haven't applied to any hospitals yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {applications.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{a.hospital_name}</p>
                  {a.hospital_address && <p className="text-xs text-slate">{a.hospital_address}</p>}
                  <p className="text-sm text-slate">
                    {a.days.join(", ")} · {a.start_time?.slice(0, 5)}–{a.end_time?.slice(0, 5)}
                  </p>
                  <p className="token-number mt-1 text-sm text-teal-dark">Rs {a.fee} · {a.patients_per_day} patients/day</p>
                </div>
                <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
              </div>

              {a.status === "approved" && (
                <div className="mt-4 flex items-center gap-3 border-t border-slate-light/20 pt-4">
                  <span className="text-sm text-slate">
                    Currently: <strong className={a.is_available ? "text-teal-dark" : "text-coral"}>
                      {a.is_available ? "Available" : "Unavailable"}
                    </strong>
                  </span>
                  <Button
                    variant="outline"
                    disabled={togglingId === a.id}
                    onClick={() => toggleAvailability(a.id)}
                  >
                    {togglingId === a.id ? "Updating..." : a.is_available ? "Mark unavailable" : "Mark available"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
