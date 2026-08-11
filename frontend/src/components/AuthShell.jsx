import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Lock,
  ShieldCheck,
  Star,
  Ticket,
} from "lucide-react";

// Copy + trust signals for the context panel beside each login form. Keyed by
// portal so the three login screens share one layout without sharing a voice:
// patients get reassurance, doctors and admins get "here's what's inside".
const PANELS = {
  patient: {
    badge: "Patient access",
    heading: "Your care, without the guesswork.",
    blurb:
      "Log in to book verified doctors, follow your token in real time, and keep every appointment in one place.",
    points: [
      {
        icon: Ticket,
        title: "Token-based booking",
        text: "See where you are in the queue before you leave the house.",
      },
      {
        icon: Star,
        title: "Reviews you can trust",
        text: "Only patients who completed a visit can rate a doctor.",
      },
      {
        icon: ShieldCheck,
        title: "Verified doctors",
        text: "Every doctor is checked and approved before being listed.",
      },
    ],
    note: "Your details are only used to manage your appointments.",
  },
  doctor: {
    badge: "Doctor portal",
    heading: "Run your clinic day from one screen.",
    blurb:
      "Log in to manage hospital applications, keep your public profile current, and work through today's queue.",
    points: [
      {
        icon: CalendarDays,
        title: "Today's queue at a glance",
        text: "Every booked token for the day, in the order you'll see them.",
      },
      {
        icon: Building2,
        title: "Apply to hospitals",
        text: "Request a slot at any listed hospital and set your fee and timings.",
      },
      {
        icon: ClipboardCheck,
        title: "Track your approvals",
        text: "Follow each application from submitted through to approved.",
      },
    ],
    note: "For registered medical professionals only.",
  },
  admin: {
    badge: "Admin console",
    heading: "Keep MediConnect accurate and trusted.",
    blurb:
      "Review doctor applications, curate the hospital directory, and keep an eye on bookings across the platform.",
    points: [
      {
        icon: ClipboardCheck,
        title: "Doctor approvals",
        text: "Verify credentials before a doctor becomes bookable.",
      },
      {
        icon: Building2,
        title: "Hospitals & directory",
        text: "Maintain hospitals, cities, and specializations.",
      },
      {
        icon: CalendarDays,
        title: "Booking oversight",
        text: "Spot problems across appointments platform-wide.",
      },
    ],
    note: "Restricted to authorised administrators.",
  },
};

/**
 * Shared two-column layout for the login/auth screens: a dark context panel on
 * the left and the form card on the right.
 *
 * The form column comes FIRST in the DOM (and is reordered visually with
 * `lg:order-*`) so keyboard and screen-reader users reach the fields
 * immediately — the panel is supporting context, not something to tab through.
 * Below `lg` the panel is dropped entirely rather than stacked, keeping the
 * form above the fold on a phone.
 *
 * @param {object} props
 * @param {"patient"|"doctor"|"admin"} [props.variant] Which portal is logging in.
 * @param {string} props.title Form heading (the page's <h1>).
 * @param {string} [props.subtitle] One line under the heading.
 * @param {React.ReactNode} [props.notice] Contextual banner, e.g. "log in to continue".
 * @param {React.ReactNode} [props.error] Error banner, rendered above the fields.
 * @param {React.ReactNode} [props.footer] Small print under the card (sign-up links etc).
 */
export default function AuthShell({
  variant = "patient",
  title,
  subtitle,
  notice,
  error,
  footer,
  children,
}) {
  const panel = PANELS[variant] ?? PANELS.patient;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-2 lg:items-stretch lg:gap-14 lg:py-20">
      <div className="order-1 mx-auto w-full max-w-md animate-fade-up lg:order-2 lg:max-w-none lg:self-center">
        <div className="rounded-3xl border border-slate-light/30 bg-white p-7 shadow-sm sm:p-9">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate">{subtitle}</p>}

          {notice && <div className="mt-5">{notice}</div>}
          {error && <div className="mt-5">{error}</div>}

          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-slate">{footer}</div>}
      </div>

      <aside className="relative order-2 hidden overflow-hidden rounded-3xl bg-ink p-10 text-white lg:order-1 lg:flex lg:flex-col">
        {/* Ambient brand glows. Decorative only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-teal/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-marigold/20 blur-3xl"
        />

        <div className="relative">
          <span className="token-number inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-marigold">
            {panel.badge}
          </span>
          <h2 className="mt-6 font-display text-3xl font-semibold leading-tight">{panel.heading}</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">{panel.blurb}</p>

          <ul className="mt-9 space-y-5">
            {panel.points.map((p) => (
              <li key={p.title} className="flex gap-3.5">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-marigold"
                  aria-hidden="true"
                >
                  <p.icon size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{p.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/55">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-auto flex items-center gap-2 pt-10 text-xs text-white/45">
          <Lock size={13} aria-hidden="true" /> {panel.note}
        </p>
      </aside>
    </div>
  );
}
