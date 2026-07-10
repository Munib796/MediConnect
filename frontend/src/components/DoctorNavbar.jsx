import { Link, useNavigate } from "react-router-dom";
import { useDoctorAuth } from "../context/DoctorAuthContext";
import { Button } from "./ui";

export default function DoctorNavbar() {
  const { doctor, logout } = useDoctorAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-light/20 bg-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/doctor" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold text-white">MediConnect</span>
          <span className="token-number rounded-full bg-marigold px-2 py-0.5 text-[10px] font-semibold text-ink">
            DOCTOR
          </span>
        </Link>

        {!doctor && (
          <Link to="/" className="hidden text-sm font-medium text-white/60 hover:text-white sm:inline">
            Back to site
          </Link>
        )}

        {doctor && (
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
            <Link to="/doctor/profile" className="hover:text-white">Profile</Link>
            <Link to="/doctor/applications" className="hover:text-white">My Applications</Link>
            <Link to="/doctor/appointments" className="hover:text-white">Appointments</Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {doctor ? (
            <Button
              variant="outline"
              className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
              onClick={() => {
                logout();
                navigate("/doctor/login");
              }}
            >
              Log out
            </Button>
          ) : (
            <>
              <Link to="/doctor/login" className="text-sm font-medium text-white/70 hover:text-white">
                Log in
              </Link>
              <Button variant="accent" onClick={() => navigate("/doctor/signup")}>Join as a doctor</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
