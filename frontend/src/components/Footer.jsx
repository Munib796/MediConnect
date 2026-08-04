import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";

const YEAR = new Date().getFullYear();

// Shared link styling for the dark footer. focus-visible keeps keyboard users
// oriented without adding chrome for mouse users.
const linkCls =
  "text-white/55 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline";

// Every destination below maps to a real route in App.jsx — no placeholder or
// dead links. Patient links never leak into the doctor/admin footer, and the
// reverse holds too: each portal only advertises what genuinely lives there.
const PUBLIC_COLUMNS = [
  {
    title: "For Patients",
    links: [
      { to: "/hospitals", label: "Find Hospitals" },
      { to: "/search", label: "Search Doctors" },
      { to: "/my-appointments", label: "My Appointments" },
      { to: "/signup", label: "Create an account" },
    ],
  },
  {
    title: "For Doctors",
    links: [
      { to: "/doctor", label: "Doctor Portal" },
      { to: "/doctor/signup", label: "Join as a doctor" },
      { to: "/doctor/login", label: "Doctor Login" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Us" },
      { to: "/login", label: "Patient Login" },
    ],
  },
];

const DOCTOR_LINKS = [
  { to: "/doctor", label: "Doctor Home" },
  { to: "/doctor/appointments", label: "Appointments" },
  { to: "/doctor/applications", label: "My Applications" },
  { to: "/doctor/profile", label: "Profile" },
  { to: "/", label: "Back to patient site" },
];

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/approvals", label: "Approvals" },
  { to: "/admin/hospitals", label: "Hospitals" },
  { to: "/admin/appointments", label: "Appointments" },
];

function Brand({ to, badge }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold/50"
      aria-label="MediConnect home"
    >
      <span className="font-display text-lg font-semibold text-white">MediConnect</span>
      <span className="token-number rounded-full bg-marigold px-2 py-0.5 text-[10px] font-semibold text-ink">
        {badge}
      </span>
    </Link>
  );
}

function BottomBar({ note }) {
  return (
    <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
      <p>© {YEAR} MediConnect. All rights reserved.</p>
      {note && <p>{note}</p>}
    </div>
  );
}

// Rich, multi-column footer for the public/patient site — the "standard
// website" footer with real link columns split by audience plus contact info.
function PublicFooter() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Brand to="/" badge="PK" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
            Finding the right doctor, without asking around. Book verified doctors
            across Pakistan in a few taps.
          </p>
          <div className="mt-5 space-y-2 text-sm text-white/55">
            <a href="mailto:support@mediconnect.com" className={`flex w-fit items-center gap-2 ${linkCls}`}>
              <Mail size={15} /> support@mediconnect.com
            </a>
            <p className="flex items-center gap-2">
              <MapPin size={15} /> Karachi, Pakistan
            </p>
          </div>
        </div>

        {PUBLIC_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold text-white">{col.title}</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <BottomBar note="Built for patients across Pakistan." />
    </div>
  );
}

// Compact single-row footer for the internal portals (doctor/admin). These are
// working tools, not marketing pages, so the footer stays minimal: brand,
// one-line context, the handful of destinations that actually exist, copyright.
function CompactFooter({ to, badge, tagline, links, note }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Brand to={to} badge={badge} />
          <p className="mt-2 max-w-sm text-sm text-white/55">{tagline}</p>
        </div>
        <nav aria-label="Footer links" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className={linkCls}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <BottomBar note={note} />
    </div>
  );
}

/**
 * Context-aware site footer.
 * @param {{ variant?: "public" | "doctor" | "admin" }} props
 */
export default function Footer({ variant = "public" }) {
  let content;
  if (variant === "doctor") {
    content = (
      <CompactFooter
        to="/doctor"
        badge="DOCTOR"
        tagline="The doctor portal — manage your applications, profile, and appointments in one place."
        links={DOCTOR_LINKS}
        note="For medical professionals."
      />
    );
  } else if (variant === "admin") {
    content = (
      <CompactFooter
        to="/admin"
        badge="ADMIN"
        tagline="MediConnect administration console — hospitals, doctors, and bookings."
        links={ADMIN_LINKS}
        note="Internal use only."
      />
    );
  } else {
    content = <PublicFooter />;
  }

  return (
    <footer className="mt-16 border-t border-white/10 bg-ink text-white">
      {content}
    </footer>
  );
}
