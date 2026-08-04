import { Outlet, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AssistantWidget from "./AssistantWidget";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useDoctorAuth } from "../context/DoctorAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Spinner } from "./ui";

export default function Layout() {
  const { patient } = usePatientAuth();
  const { doctor, loading: doctorLoading } = useDoctorAuth();
  const { admin, loading: adminLoading } = useAdminAuth();

  if (doctorLoading || adminLoading) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  if (doctor) {
    return <Navigate to="/doctor" replace />;
  }

  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer variant="public" />
      {patient && <AssistantWidget />}
    </div>
  );
}