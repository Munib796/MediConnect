import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PatientAuthProvider } from "./context/PatientAuthContext";
import { DoctorAuthProvider } from "./context/DoctorAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import Layout from "./components/Layout";
import DoctorLayout from "./components/DoctorLayout";
import AdminLayout from "./components/AdminLayout";
import ProtectedPatientRoute from "./components/ProtectedPatientRoute";
import ProtectedDoctorRoute from "./components/ProtectedDoctorRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

import Landing from "./pages/public/Landing";
import HospitalsList from "./pages/public/HospitalsList";
import HospitalDetail from "./pages/public/HospitalDetail";
import SearchResults from "./pages/public/SearchResults";

import Signup from "./pages/patient/Signup";
import Login from "./pages/patient/Login";
import VerifyEmail from "./pages/patient/VerifyEmail";
import ForgotPassword from "./pages/patient/ForgotPassword";
import ResetPassword from "./pages/patient/ResetPassword";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";

import DoctorHome from "./pages/doctor/DoctorHome";
import DoctorSignup from "./pages/doctor/DoctorSignup";
import DoctorLogin from "./pages/doctor/DoctorLogin";
import DoctorVerifyEmail from "./pages/doctor/DoctorVerifyEmail";
import DoctorForgotPassword from "./pages/doctor/DoctorForgotPassword";
import DoctorResetPassword from "./pages/doctor/DoctorResetPassword";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import DoctorApply from "./pages/doctor/DoctorApply";
import DoctorApplications from "./pages/doctor/DoctorApplications";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCities from "./pages/admin/AdminCities";
import AdminSpecializations from "./pages/admin/AdminSpecializations";
import AdminHospitals from "./pages/admin/AdminHospitals";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminAppointments from "./pages/admin/AdminAppointments";

export default function App() {
  return (
    <PatientAuthProvider>
      <DoctorAuthProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/hospitals" element={<HospitalsList />} />
                <Route path="/hospitals/:hospitalId" element={<HospitalDetail />} />
                <Route path="/search" element={<SearchResults />} />

                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/patients/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/patients/reset-password" element={<ResetPassword />} />

                <Route
                  path="/book/:doctorHospitalId"
                  element={
                    <ProtectedPatientRoute>
                      <BookAppointment />
                    </ProtectedPatientRoute>
                  }
                />
                <Route
                  path="/my-appointments"
                  element={
                    <ProtectedPatientRoute>
                      <MyAppointments />
                    </ProtectedPatientRoute>
                  }
                />

                <Route path="*" element={<Landing />} />
              </Route>

              <Route element={<DoctorLayout />}>
                <Route path="/doctor" element={<DoctorHome />} />
                <Route path="/doctor/signup" element={<DoctorSignup />} />
                <Route path="/doctor/login" element={<DoctorLogin />} />
                <Route path="/doctors/verify-email" element={<DoctorVerifyEmail />} />
                <Route path="/doctor/forgot-password" element={<DoctorForgotPassword />} />
                <Route path="/doctors/reset-password" element={<DoctorResetPassword />} />

                <Route
                  path="/doctor/profile"
                  element={
                    <ProtectedDoctorRoute>
                      <DoctorProfile />
                    </ProtectedDoctorRoute>
                  }
                />
                <Route
                  path="/doctor/apply"
                  element={
                    <ProtectedDoctorRoute>
                      <DoctorApply />
                    </ProtectedDoctorRoute>
                  }
                />
                <Route
                  path="/doctor/applications"
                  element={
                    <ProtectedDoctorRoute>
                      <DoctorApplications />
                    </ProtectedDoctorRoute>
                  }
                />
                <Route
                  path="/doctor/appointments"
                  element={
                    <ProtectedDoctorRoute>
                      <DoctorAppointments />
                    </ProtectedDoctorRoute>
                  }
                />
              </Route>

              <Route element={<AdminLayout />}>
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/approvals"
                  element={
                    <ProtectedAdminRoute>
                      <AdminApprovals />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/hospitals"
                  element={
                    <ProtectedAdminRoute>
                      <AdminHospitals />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/cities"
                  element={
                    <ProtectedAdminRoute>
                      <AdminCities />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/specializations"
                  element={
                    <ProtectedAdminRoute>
                      <AdminSpecializations />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/appointments"
                  element={
                    <ProtectedAdminRoute>
                      <AdminAppointments />
                    </ProtectedAdminRoute>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </DoctorAuthProvider>
    </PatientAuthProvider>
  );
}
