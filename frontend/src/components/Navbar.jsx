import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { User, ChevronDown, LogOut, Menu, X, CalendarCheck, Stethoscope } from "lucide-react";
import { usePatientAuth } from "../context/PatientAuthContext";
import { Button } from "./ui";

// Primary public/patient nav destinations. `end` marks routes that should only
// be "active" on an exact match (so "/" isn't active on every page).
const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/hospitals", label: "Find Hospitals" },
  { to: "/about", label: "About Us" },
];

export default function Navbar() {
  const { patient, logout } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close both menus whenever the route changes, so a tap in the mobile
  // drawer doesn't leave it hanging open over the new page.
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }) =>
    `relative py-1 transition-colors hover:text-teal ${
      isActive ? "text-teal" : "text-ink/80"
    } after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:rounded-full after:bg-teal after:transition-all after:duration-200 ${
      isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-light/20 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo — always routes to the site home. */}
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg"
          aria-label="MediConnect home"
        >
          <span className="font-display text-xl font-semibold text-ink">MediConnect</span>
          <span className="token-number rounded-full bg-marigold-light px-2 py-0.5 text-[10px] font-semibold text-marigold-dark">
            PK
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          {patient && (
            <NavLink to="/my-appointments" end={false} className={linkClass}>
              My Appointments
            </NavLink>
          )}
          {!patient && (
            <NavLink to="/doctor" className={linkClass}>
              For Doctors
            </NavLink>
          )}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          {patient ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-1.5 rounded-full border border-slate-light/50 py-1.5 pl-1.5 pr-3 text-ink/80 transition-colors hover:border-teal hover:text-teal focus-visible:ring-2 focus-visible:ring-teal/40"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-light text-teal-dark">
                  <User size={14} />
                </span>
                <ChevronDown size={14} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-52 origin-top-right animate-scale-in overflow-hidden rounded-xl border border-slate-light/30 bg-white py-1.5 text-sm shadow-lg"
                >
                  {patient.name && (
                    <div className="border-b border-slate-light/20 px-4 py-2">
                      <p className="truncate font-medium text-ink">{patient.name}</p>
                      <p className="text-xs text-slate">Patient account</p>
                    </div>
                  )}
                  <Link
                    to="/my-appointments"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-ink/80 hover:bg-teal-light/50 hover:text-teal-dark"
                  >
                    <CalendarCheck size={15} /> My Appointments
                  </Link>
                  <Link
                    to="/profile"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-ink/80 hover:bg-teal-light/50 hover:text-teal-dark"
                  >
                    <User size={15} /> My Profile
                  </Link>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-coral hover:bg-coral-light"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-medium text-ink/80 hover:text-teal sm:block">
                Log in
              </Link>
              <Button onClick={() => navigate("/signup")} className="hidden sm:inline-flex">
                Sign up
              </Button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-teal-light md:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          className="animate-fade-in border-t border-slate-light/20 bg-paper px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-1 text-sm font-medium">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 transition-colors ${
                    isActive ? "bg-teal-light text-teal-dark" : "text-ink/80 hover:bg-teal-light/50"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {patient && (
              <NavLink
                to="/my-appointments"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 transition-colors ${
                    isActive ? "bg-teal-light text-teal-dark" : "text-ink/80 hover:bg-teal-light/50"
                  }`
                }
              >
                My Appointments
              </NavLink>
            )}

            <div className="my-2 border-t border-slate-light/20" />

            <NavLink
              to="/doctor"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-teal-light/50"
            >
              <Stethoscope size={16} /> For Doctors
            </NavLink>

            {!patient && (
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
                  Log in
                </Button>
                <Button onClick={() => navigate("/signup")} className="w-full">
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
