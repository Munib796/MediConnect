import { Outlet, Navigate } from "react-router-dom";
import DoctorNavbar from "./DoctorNavbar";
import Footer from "./Footer";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Spinner } from "./ui";

export default function DoctorLayout() {
  const { patient, loading: patientLoading } = usePatientAuth();
  const { admin, loading: adminLoading } = useAdminAuth();

  if (patientLoading || adminLoading) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  if (patient) {
    return <Navigate to="/" replace />;
  }

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <DoctorNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}