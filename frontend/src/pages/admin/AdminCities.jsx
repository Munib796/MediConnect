import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import { Button, Input, Card, Alert, Spinner } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Trash2, Pencil, Check, X, MapPin } from "lucide-react";

// Shared base for the small round icon buttons — includes focus-visible rings
// for keyboard accessibility.
const ICON_BTN =
  "rounded-full p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal/40";

export default function AdminCities() {
  usePageTitle("Manage Cities");
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", province: "" });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", province: "" });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .get("/admin/cities", withAuth("admin"))
      .then((res) => setCities(res.data))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.post(
        "/admin/cities",
        { name: form.name, province: form.province || undefined },
        withAuth("admin")
      );
      setForm({ name: "", province: "" });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function startEdit(city) {
    setEditingId(city.id);
    setEditForm({ name: city.name, province: city.province || "" });
    setError("");
  }

  async function saveEdit(id) {
    setError("");
    try {
      await api.patch(
        `/admin/cities/${id}`,
        { name: editForm.name, province: editForm.province || undefined },
        withAuth("admin")
      );
      setEditingId(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function confirmDelete() {
    const id = pendingDelete;
    setError("");
    setDeleting(true);
    try {
      await api.delete(`/admin/cities/${id}`, withAuth("admin"));
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Cities</h1>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3">
        <Input
          label="City name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Province (optional)"
          value={form.province}
          onChange={(e) => setForm({ ...form, province: e.target.value })}
        />
        <Button type="submit" disabled={creating}>
          {creating ? "Adding..." : "Add city"}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16 text-teal"><Spinner /></div>
      ) : cities.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light text-teal">
            <MapPin size={26} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">No cities yet</p>
            <p className="mt-1 text-sm text-slate">Add your first city using the form above.</p>
          </div>
        </Card>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {cities.map((city) => (
            <Card key={city.id} className="flex items-center justify-between gap-3 p-4">
              {editingId === city.id ? (
                <>
                  <div className="flex flex-1 gap-3">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      value={editForm.province}
                      onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                      className="flex-1"
                      placeholder="Province"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(city.id)}
                      aria-label="Save"
                      className={`${ICON_BTN} bg-teal-light text-teal-dark hover:bg-teal/20`}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel"
                      className={`${ICON_BTN} bg-paper text-slate hover:bg-slate-light/30`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium text-ink">{city.name}</p>
                    {city.province && <p className="text-xs text-slate">{city.province}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(city)}
                      aria-label={`Edit ${city.name}`}
                      className={`${ICON_BTN} bg-paper text-slate hover:bg-teal-light hover:text-teal-dark`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(city.id)}
                      aria-label={`Delete ${city.name}`}
                      className={`${ICON_BTN} bg-paper text-slate hover:bg-coral-light hover:text-coral`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete city?"
        message="Hospitals linked to this city may be affected. This can't be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
