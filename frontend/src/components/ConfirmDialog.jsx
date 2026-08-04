import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Spinner } from "./ui";

// Reusable confirmation modal, used in place of the browser's native confirm()
// for destructive admin actions. Accessible: role="dialog" + aria-modal, focus
// lands on the confirm button when it opens, and Escape cancels.
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Focus the confirm button on open so keyboard users land inside the dialog.
    confirmRef.current?.focus();

    function handleKey(e) {
      if (e.key === "Escape" && !loading) onCancel?.();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const accent =
    tone === "danger"
      ? "bg-coral-light text-coral"
      : "bg-marigold-light text-marigold-dark";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop — clicking it cancels, unless an action is in flight. */}
      <div
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm"
        onClick={() => !loading && onCancel?.()}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-slate-light/30 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accent}`}>
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
            {message && <p className="mt-1 text-sm text-slate">{message}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner className="h-4 w-4" /> : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
