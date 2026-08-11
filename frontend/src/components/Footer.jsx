import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useDoctorAuth } from "../context/DoctorAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";

const YEAR = new Date().getFullYear();

// Shared link styling for the dark footer. focus-visible keeps keyboard users
// oriented without adding chrome for mouse users.
const linkCls =
  "text-white/55 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline";

/*
 * Every destination below maps to a real route in App.jsx AND is reachable for
 * the person currently looking at it. That second half matters, because the
 * layouts guard hard against cross-portal browsing:
 *
 *   - Layout       redirects a logged-in doctor/admin away from the public site
 *   - DoctorLayout redirects a logged-in patient/admin away from /doctor/*
 *   - AdminLayout  redirects a logged-in patient/doctor away from /admin/*
 *   - Protected*Route bounces anonymous visitors to the matching login page
 *
 * So a link can resolve to a real route and still be a dead end — e.g. offering
 * "Doctor Portal" to a signed-in patient just bounces them back to "/". The link
 * sets below are therefore built from auth state rather than hardcoded.
 */

// Public/patient site. Signed-in patients get their account pages; anonymous
// visitors get the sign-up paths and the doctor portal (which they can reach).
function publicColumns(patient) {
  if (patient) {
    return [
      {
        title: "Browse",
        links: [
          { to: "/hospitals", label: "Find Hospitals" },
          { to: "/search", label: "Search Doctors" },
        ],
      },
      {
        title: "Your Account",
        links: [
          { to: "/my-appointments", label: "My Appointments" },
          { to: "/profile", label: "My Profile" },
        ],
      },
      { title: "Company", links: [{ to: "/about", label: "About Us" }] },
    ];
  }

  return [
    {
      title: "For Patients",
      links: [
        { to: "/hospitals", label: "Find Hospitals" },
        { to: "/search", label: "Search Doctors" },
        { to: "/signup", label: "Create an account" },
        { to: "/login", label: "Patient Login" },
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
    { title: "Company", links: [{ to: "/about", label: "About Us" }] },
  ];
}

// Doctor portal. "Back to patient site" is deliberately absent once a doctor is
// signed in — Layout would redirect them straight back to /doctor.
function doctorLinks(doctor) {
  if (doctor) {
    return [
      { to: "/doctor", label: "Doctor Home" },
      { to: "/doctor/appointments", label: "Appointments" },
      { to: "/doctor/applications", label: "My Applications" },
      { to: "/doctor/apply", label: "Apply to a hospital" },
      { to: "/doctor/profile", label: "Profile" },
    ];
  }

  return [
    { to: "/doctor", label: "Doctor Portal" },
    { to: "/doctor/login", label: "Doctor Login" },
    { to: "/doctor/signup", label: "Join as a doctor" },
    { to: "/", label: "Back to patient site" },
  ];
}

// Admin console. Signed-out admins only get the login link; every other admin
// route is behind ProtectedAdminRoute and would bounce them right back.
function adminLinks(admin) {
  if (admin) {
    return [
      { to: "/admin", label: "Dashboard" },
      { to: "/admin/approvals", label: "Approvals" },
      { to: "/admin/hospitals", label: "Hospitals" },
      { to: "/admin/cities", label: "Cities" },
      { to: "/admin/specializations", label: "Specializations" },
      { to: "/admin/appointments", label: "Appointments" },
    ];
  }

  return [
    { to: "/admin/login", label: "Admin Login" },
    { to: "/", label: "Back to patient site" },
  ];
}

function Brand({ to, badge, label = "MediConnect home" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold/50"
      aria-label={label}
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
function PublicFooter({ patient }) {
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

        {publicColumns(patient).map((col) => (
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
function CompactFooter({ to, badge, brandLabel, tagline, links, note }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Brand to={to} badge={badge} label={brandLabel} />
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
  const { patient } = usePatientAuth();
  const { doctor } = useDoctorAuth();
  const { admin } = useAdminAuth();

  let content;
  if (variant === "doctor") {
    content = (
      <CompactFooter
        to="/doctor"
        badge="DOCTOR"
        brandLabel="Doctor portal home"
        tagline={
          doctor
            ? "The doctor portal — manage your applications, profile, and appointments in one place."
            : "Log in or apply to join MediConnect as a verified doctor."
        }
        links={doctorLinks(doctor)}
        note="For medical professionals."
      />
    );
  } else if (variant === "admin") {
    content = (
      <CompactFooter
        to={admin ? "/admin" : "/admin/login"}
        badge="ADMIN"
        brandLabel={admin ? "Admin dashboard" : "Admin login"}
        tagline={
          admin
            ? "MediConnect administration console — hospitals, doctors, and bookings."
            : "Restricted console. Sign in with your administrator account to continue."
        }
        links={adminLinks(admin)}
        note="Internal use only."
      />
    );
  } else {
    content = <PublicFooter patient={patient} />;
  }

  return (
    <footer className="mt-16 border-t border-white/10 bg-ink text-white">
      {content}
    </footer>
  );
}
