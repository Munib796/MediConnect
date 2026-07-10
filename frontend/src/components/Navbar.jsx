import { Link, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext";
import { Button } from "./ui";

export default function Navbar() {
  const { patient, logout } = usePatientAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-light/20 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold text-ink">MediConnect</span>
          <span className="token-number rounded-full bg-marigold-light px-2 py-0.5 text-[10px] font-semibold text-marigold-dark">
            PK
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-ink/80 md:flex">
          <Link to="/hospitals" className="hover:text-teal">Find Hospitals</Link>
          {patient && <Link to="/my-appointments" className="hover:text-teal">My Appointments</Link>}
          {!patient && <Link to="/doctor" className="hover:text-teal">For Doctors</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {patient ? (
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out
            </Button>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-medium text-ink/80 hover:text-teal sm:block">
                Log in
              </Link>
              <Button onClick={() => navigate("/signup")}>Sign up</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
