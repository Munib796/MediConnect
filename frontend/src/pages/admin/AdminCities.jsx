import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Button, Input, Card, Alert, Spinner } from "../../components/ui";
import { Trash2, Pencil, Check, X } from "lucide-react";

export default function AdminCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", province: "" });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", province: "" });

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

  async function handleDelete(id) {
    if (!confirm("Delete this city? This can't be undone.")) return;
    setError("");
    try {
      await api.delete(`/admin/cities/${id}`, withAuth("admin"));
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
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
                      className="rounded-full bg-teal-light p-2 text-teal-dark hover:bg-teal/20"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-full bg-paper p-2 text-slate hover:bg-slate-light/30"
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
                      className="rounded-full bg-paper p-2 text-slate hover:bg-teal-light hover:text-teal-dark"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(city.id)}
                      className="rounded-full bg-paper p-2 text-slate hover:bg-coral-light hover:text-coral"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
          {cities.length === 0 && <p className="text-slate">No cities yet.</p>}
        </div>
      )}
    </div>
  );
}
