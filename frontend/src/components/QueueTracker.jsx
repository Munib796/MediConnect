import { Clock, CheckCircle2, XCircle, Info } from "lucide-react";
import { Progress } from "./ui";

// Visual queue tracker for a single upcoming (booked) appointment.
//
// Honesty note: the backend does not expose a live "now serving" feed, so we
// never invent a fake current number. Instead we show the patient's real token
// against the clinic's real daily capacity (patients_per_day, surfaced on the
// appointment) as an at-a-glance sense of where their token falls in the day.
// The "live" position is explicitly framed as an estimate, not a promise.
export default function QueueTracker({ appointment }) {
  const token = appointment.token_number;
  const capacity = appointment.patients_per_day || null;

  // Fraction of the day's tokens up to and including this one. If capacity is
  // unknown we can't draw a meaningful bar, so we fall back to a neutral state.
  const hasCapacity = Boolean(capacity) && token <= capacity;
  const pct = hasCapacity ? Math.round((token / capacity) * 100) : null;

  return (
    <div className="rounded-2xl border border-teal/15 bg-teal-light/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-teal-dark">
          <span className="live-dot text-teal">
            <span />
          </span>
          Queue status
        </div>
        <span className="token-number rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-dark">
          Token #{String(token).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate">Your token</p>
          <p className="token-number text-4xl font-bold leading-none text-teal">
            {String(token).padStart(2, "0")}
          </p>
        </div>
        {hasCapacity && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-slate">Daily capacity</p>
            <p className="token-number text-4xl font-bold leading-none text-ink/30">
              {String(capacity).padStart(2, "0")}
            </p>
          </div>
        )}
      </div>

      {hasCapacity ? (
        <div className="mt-4">
          <Progress value={token} max={capacity} tone="teal" />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate">
            <Info size={13} className="shrink-0" />
            Roughly {pct}% into the day's tokens. Arrive a little before yours is
            expected to be called.
          </p>
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate">
          <Info size={13} className="shrink-0" />
          Arrive a little before your token is expected to be called.
        </p>
      )}
    </div>
  );
}

// Small status pill with an icon, mapped to the appointment lifecycle.
export function StatusPill({ status }) {
  const map = {
    booked: {
      tone: "bg-teal-light text-teal-dark",
      icon: Clock,
      label: "Booked",
    },
    completed: {
      tone: "bg-sage-light text-sage",
      icon: CheckCircle2,
      label: "Completed",
    },
    cancelled: {
      tone: "bg-coral-light text-coral",
      icon: XCircle,
      label: "Cancelled",
    },
  };
  const cfg = map[status] || map.booked;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.tone}`}>
      <Icon size={13} />
      {cfg.label}
    </span>
  );
}
