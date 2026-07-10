import { createContext, useContext, useEffect, useState } from "react";
import { api, withAuth, storeToken, clearToken, getStoredToken } from "../lib/api";

const PatientAuthContext = createContext(null);

export function PatientAuthProvider({ children }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken("patient");
    if (!token) {
      setLoading(false);
      return;
    }
    // We don't have a "GET /patients/me" endpoint on the backend today,
    // so we just trust the stored token until an authenticated call fails.
    setPatient({ loggedIn: true });
    setLoading(false);
  }, []);

  async function login(email, password) {
    const res = await api.post("/patients/login", { email, password });
    storeToken("patient", res.data.access_token);
    setPatient({ loggedIn: true });
    return res.data;
  }

  async function signup(payload) {
    const res = await api.post("/patients/signup", payload);
    return res.data;
  }

  function logout() {
    clearToken("patient");
    setPatient(null);
  }

  return (
    <PatientAuthContext.Provider value={{ patient, loading, login, signup, logout, authHeaders: () => withAuth("patient") }}>
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  return useContext(PatientAuthContext);
}
