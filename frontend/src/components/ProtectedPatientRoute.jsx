import { Navigate, useLocation } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext";
import { Spinner } from "./ui";

export default function ProtectedPatientRoute({ children }) {
  const { patient, loading } = usePatientAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  if (!patient) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
