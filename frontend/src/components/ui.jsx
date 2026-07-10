export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm px-6 py-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-teal text-white hover:bg-teal-dark shadow-sm hover:shadow-md",
    accent: "bg-marigold text-ink hover:bg-marigold-dark shadow-sm hover:shadow-md",
    ghost: "bg-transparent text-teal hover:bg-teal-light",
    outline: "bg-white text-ink border border-slate-light/60 hover:border-teal",
    danger: "bg-coral text-white hover:bg-coral/90",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <input
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-light focus:border-teal ${
          error ? "border-coral" : "border-slate-light/50"
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  );
}

export function TextArea({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <textarea
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-light focus:border-teal ${
          error ? "border-coral" : "border-slate-light/50"
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  );
}

export function Select({ label, error, className = "", children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <select
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal ${
          error ? "border-coral" : "border-slate-light/50"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-light/30 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-light text-teal-dark",
    marigold: "bg-marigold-light text-marigold-dark",
    coral: "bg-coral-light text-coral",
    slate: "bg-paper text-slate",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
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
