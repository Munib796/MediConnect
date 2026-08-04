import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Building2,
  MapPin,
  Stethoscope,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Button } from "./ui";

// Admin sections, in the order they appear in the bar. Each carries an icon so
// the mobile drawer reads clearly.
const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { to: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { to: "/admin/cities", label: "Cities", icon: MapPin },
  { to: "/admin/specializations", label: "Specializations", icon: Stethoscope },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
];

export default function AdminNavbar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes so a tap doesn't leave
  // it hanging open over the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Desktop link: white when active with an underline, muted otherwise. Tuned
  // for the dark ink bar (the public navbar uses teal on paper).
  const linkClass = ({ isActive }) =>
    `relative py-1 transition-colors hover:text-white ${
      isActive ? "text-white" : "text-white/70"
    } after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:rounded-full after:bg-marigold after:transition-all after:duration-200 ${
      isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
    }`;

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/admin" className="flex items-center gap-2 rounded-lg" aria-label="Admin dashboard">
          <span className="font-display text-xl font-semibold text-white">MediConnect</span>
          <span className="token-number rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold text-white">
            ADMIN
          </span>
        </Link>

        {admin ? (
          <>
            {/* Desktop nav */}
            <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
              {ADMIN_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="hidden border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10 lg:inline-flex"
                onClick={handleLogout}
              >
                Log out
              </Button>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="admin-mobile-nav"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 lg:hidden"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </>
        ) : (
          <Link to="/" className="text-sm font-medium text-white/60 hover:text-white">
            Back to site
          </Link>
        )}
      </div>

      {/* Mobile drawer */}
      {admin && mobileOpen && (
        <nav
          id="admin-mobile-nav"
          className="animate-fade-in border-t border-white/10 bg-ink px-6 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-1 text-sm font-medium">
            {ADMIN_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <l.icon size={16} /> {l.label}
              </NavLink>
            ))}

            <div className="my-2 border-t border-white/10" />

            <Button
              variant="outline"
              className="w-full border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"
              onClick={handleLogout}
            >
              Log out
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
