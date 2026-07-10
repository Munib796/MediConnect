import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Button, Input, Card, Alert, Spinner } from "../../components/ui";
import { Trash2, Pencil, Check, X } from "lucide-react";

export default function AdminSpecializations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .get("/admin/specializations", withAuth("admin"))
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.post("/admin/specializations", { name }, withAuth("admin"));
      setName("");
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditName(item.name);
    setError("");
  }

  async function saveEdit(id) {
    setError("");
    try {
      await api.patch(`/admin/specializations/${id}`, { name: editName }, withAuth("admin"));
      setEditingId(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this specialization? This can't be undone.")) return;
    setError("");
    try {
      await api.delete(`/admin/specializations/${id}`, withAuth("admin"));
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Specializations</h1>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <form onSubmit={handleCreate} className="mt-6 flex items-end gap-3">
        <Input
          label="Specialization name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={creating}>
          {creating ? "Adding..." : "Add"}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16 text-teal"><Spinner /></div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-3 p-4">
              {editingId === item.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(item.id)}
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
                  <p className="font-medium text-ink">{item.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded-full bg-paper p-2 text-slate hover:bg-teal-light hover:text-teal-dark"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-full bg-paper p-2 text-slate hover:bg-coral-light hover:text-coral"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
          {items.length === 0 && <p className="text-slate">No specializations yet.</p>}
        </div>
      )}
    </div>
  );
}
