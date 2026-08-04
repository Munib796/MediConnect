import { useEffect, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Button, Input, Card, Alert, Spinner } from "../../components/ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import { usePageTitle } from "../../lib/usePageTitle";
import { Trash2, Pencil, Check, X, Stethoscope } from "lucide-react";

// Shared base for the small round icon buttons — includes focus-visible rings
// for keyboard accessibility.
const ICON_BTN =
  "rounded-full p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal/40";

export default function AdminSpecializations() {
  usePageTitle("Manage Specializations");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  async function confirmDelete() {
    const id = pendingDelete;
    setError("");
    setDeleting(true);
    try {
      await api.delete(`/admin/specializations/${id}`, withAuth("admin"));
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
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
      ) : items.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-light text-teal">
            <Stethoscope size={26} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">No specializations yet</p>
            <p className="mt-1 text-sm text-slate">Add your first specialization using the form above.</p>
          </div>
        </Card>
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
                  <p className="font-medium text-ink">{item.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      aria-label={`Edit ${item.name}`}
                      className={`${ICON_BTN} bg-paper text-slate hover:bg-teal-light hover:text-teal-dark`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(item.id)}
                      aria-label={`Delete ${item.name}`}
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
        title="Delete specialization?"
        message="Doctors linked to this specialization may be affected. This can't be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
