import { Outlet, Navigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import Footer from "./Footer";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useDoctorAuth } from "../context/DoctorAuthContext";
import { Spinner } from "./ui";

export default function AdminLayout() {
  const { patient, loading: patientLoading } = usePatientAuth();
  const { doctor, loading: doctorLoading } = useDoctorAuth();

  if (patientLoading || doctorLoading) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  if (patient) {
    return <Navigate to="/" replace />;
  }

  if (doctor) {
    return <Navigate to="/doctor" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AdminNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
