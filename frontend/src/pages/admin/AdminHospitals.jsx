import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Button, Input, Select, Card, Alert, Spinner } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Trash2, Pencil, Check, X, Upload, Building2 } from "lucide-react";
import { usePageTitle } from "../../lib/usePageTitle";

// Shared base for the small round icon buttons — includes focus-visible rings
// for keyboard accessibility.
const ICON_BTN =
  "rounded-full p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal/40";

export default function AdminHospitals() {
  usePageTitle("Manage Hospitals");
  const [hospitals, setHospitals] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", address: "", city_id: "" });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", address: "", city_id: "" });
  const [uploadingId, setUploadingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get("/cities").then((res) => setCities(res.data)).catch(() => {});
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .get("/admin/hospitals", withAuth("admin"))
      .then((res) => setHospitals(res.data))
      .finally(() => setLoading(false));
  }

  function cityName(id) {
    return cities.find((c) => c.id === id)?.name || "—";
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.post(
        "/admin/hospitals",
        { name: form.name, address: form.address, city_id: parseInt(form.city_id, 10) },
        withAuth("admin")
      );
      setForm({ name: "", address: "", city_id: "" });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function startEdit(h) {
    setEditingId(h.id);
    setEditForm({ name: h.name, address: h.address || "", city_id: String(h.city_id) });
    setError("");
  }

  async function saveEdit(id) {
    setError("");
    try {
      await api.patch(
        `/admin/hospitals/${id}`,
        { name: editForm.name, address: editForm.address, city_id: parseInt(editForm.city_id, 10) },
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
      await api.delete(`/admin/hospitals/${id}`, withAuth("admin"));
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function handleImageUpload(id, file) {
    if (!file) return;
    setError("");
    setUploadingId(id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/admin/hospitals/${id}/upload-image`, formData, {
        headers: { ...withAuth("admin").headers, "Content-Type": "multipart/form-data" },
      });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Hospitals</h1>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <form onSubmit={handleCreate} className="mt-6 grid gap-3 sm:grid-cols-4">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="sm:col-span-2"
        />
        <Input
          label="Address"
          required
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <Select
          label="City"
          required
          value={form.city_id}
          onChange={(e) => setForm({ ...form, city_id: e.target.value })}
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Button type="submit" disabled={creating} className="justify-center sm:col-span-4">
          {creating ? "Adding..." : "Add hospital"}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16 text-teal"><Spinner /></div>
      ) : hospitals.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light text-teal">
            <Building2 size={26} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">No hospitals yet</p>
            <p className="mt-1 text-sm text-slate">Add your first hospital using the form above.</p>
          </div>
        </Card>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {hospitals.map((h) => (
            <Card key={h.id} className="flex items-center gap-4 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-teal-light">
                {h.image_url ? (
                  <img src={h.image_url} alt={h.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-lg text-teal/40">
                    {h.name?.[0]}
                  </div>
                )}
              </div>

              {editingId === h.id ? (
                <>
                  <div className="grid flex-1 gap-2 sm:grid-cols-3">
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Address"
                    />
                    <Select value={editForm.city_id} onChange={(e) => setEditForm({ ...editForm, city_id: e.target.value })}>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => saveEdit(h.id)}
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
                  <div className="flex-1">
                    <p className="font-medium text-ink">{h.name}</p>
                    <p className="text-xs text-slate">{h.address || "No address"} · {cityName(h.city_id)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <label
                      className={`${ICON_BTN} cursor-pointer bg-paper text-slate hover:bg-teal-light hover:text-teal-dark focus-within:ring-2 focus-within:ring-teal/40`}
                      title="Upload image"
                    >
                      {uploadingId === h.id ? <Spinner className="h-4 w-4" /> : <Upload size={16} />}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        aria-label={`Upload image for ${h.name}`}
                        onChange={(e) => handleImageUpload(h.id, e.target.files[0])}
                      />
                    </label>
                    <button
                      onClick={() => startEdit(h)}
                      aria-label={`Edit ${h.name}`}
                      className={`${ICON_BTN} bg-paper text-slate hover:bg-teal-light hover:text-teal-dark`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(h.id)}
                      aria-label={`Delete ${h.name}`}
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
        title="Delete hospital?"
        message="Doctors and appointments linked to this hospital may be affected. This can't be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
