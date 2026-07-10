import { Navigate, useLocation } from "react-router-dom";
import { useDoctorAuth } from "../context/DoctorAuthContext";
import { Spinner } from "./ui";

export default function ProtectedDoctorRoute({ children }) {
  const { doctor, loading } = useDoctorAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  if (!doctor) {
    return <Navigate to="/doctor/login" state={{ from: location }} replace />;
  }

  return children;
}
