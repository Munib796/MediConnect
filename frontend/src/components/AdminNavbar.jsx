import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Button } from "./ui";

export default function AdminNavbar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-light/20 bg-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold text-white">MediConnect</span>
          <span className="token-number rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold text-white">
            ADMIN
          </span>
        </Link>

        {!admin && (
          <Link to="/" className="hidden text-sm font-medium text-white/60 hover:text-white sm:inline">
            Back to site
          </Link>
        )}

        {admin && (
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
            <Link to="/admin" className="hover:text-white">Dashboard</Link>
            <Link to="/admin/approvals" className="hover:text-white">Approvals</Link>
            <Link to="/admin/hospitals" className="hover:text-white">Hospitals</Link>
            <Link to="/admin/cities" className="hover:text-white">Cities</Link>
            <Link to="/admin/specializations" className="hover:text-white">Specializations</Link>
            <Link to="/admin/appointments" className="hover:text-white">Appointments</Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {admin && (
            <Button
              variant="outline"
              className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              Log out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
