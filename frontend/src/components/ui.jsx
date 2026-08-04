import { twMerge } from "tailwind-merge";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm px-6 py-3 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-teal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0";
  const variants = {
    primary: "bg-teal text-white hover:bg-teal-dark shadow-sm hover:shadow-md",
    accent: "bg-marigold text-ink hover:bg-marigold-dark shadow-sm hover:shadow-md",
    ghost: "bg-transparent text-teal hover:bg-teal-light",
    outline: "bg-white text-ink border border-slate-light/60 hover:border-teal",
    danger: "bg-coral text-white hover:bg-coral/90",
  };
  return (
    <button className={twMerge(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, valid, className = "", ...props }) {
  const state = error
    ? "border-coral focus:border-coral focus:ring-coral/20"
    : valid
    ? "border-sage focus:border-sage focus:ring-sage/20"
    : "border-slate-light/50 focus:border-teal focus:ring-teal/20";
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <input
        aria-invalid={error ? "true" : undefined}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-shadow transition-colors placeholder:text-slate-light focus:ring-2 ${state} ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  );
}

export function TextArea({ label, error, valid, className = "", ...props }) {
  const state = error
    ? "border-coral focus:border-coral focus:ring-coral/20"
    : valid
    ? "border-sage focus:border-sage focus:ring-sage/20"
    : "border-slate-light/50 focus:border-teal focus:ring-teal/20";
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <textarea
        aria-invalid={error ? "true" : undefined}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-shadow transition-colors placeholder:text-slate-light focus:ring-2 ${state} ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  );
}

export function Select({ label, error, valid, className = "", children, ...props }) {
  const state = error
    ? "border-coral focus:border-coral focus:ring-coral/20"
    : valid
    ? "border-sage focus:border-sage focus:ring-sage/20"
    : "border-slate-light/50 focus:border-teal focus:ring-teal/20";
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <select
        aria-invalid={error ? "true" : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-shadow transition-colors focus:ring-2 ${state} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  );
}

export function Card({ children, className = "", hoverable = false }) {
  const interaction = hoverable
    ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-teal/30"
    : "";
  return (
    <div className={`rounded-2xl border border-slate-light/30 bg-white shadow-sm ${interaction} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "teal", dot = false, className = "" }) {
  const tones = {
    teal: "bg-teal-light text-teal-dark",
    marigold: "bg-marigold-light text-marigold-dark",
    coral: "bg-coral-light text-coral",
    slate: "bg-paper text-slate",
    sage: "bg-sage-light text-sage",
    ink: "bg-ink text-white",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

// Slim horizontal progress bar. `value`/`max` describe how far along something
// is (e.g. tokens already seen out of the day's total). Purely presentational.
export function Progress({ value = 0, max = 100, tone = "teal", className = "" }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const tones = {
    teal: "bg-teal",
    marigold: "bg-marigold",
    sage: "bg-sage",
  };
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-light/20 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${tones[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <div
      className={`h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
    />
  );
}

export function Alert({ children, tone = "coral" }) {
  const tones = {
    coral: "bg-coral-light text-coral border-coral/20",
    teal: "bg-teal-light text-teal-dark border-teal/20",
    marigold: "bg-marigold-light text-marigold-dark border-marigold/30",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  );
}

export function StarRating({ rating, size = 16 }) {
  const full = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={n <= full ? "#E8A233" : "#E4E9E7"}
        >
          <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L1.4 7.8l6-.8z" />
        </svg>
      ))}
    </div>
  );
}
