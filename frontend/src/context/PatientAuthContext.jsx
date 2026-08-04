import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, withAuth, storeToken, clearToken, getStoredToken } from "../lib/api";

const PatientAuthContext = createContext(null);

export function PatientAuthProvider({ children }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get("/patients/me", withAuth("patient"));
      setPatient(res.data);
      return res.data;
    } catch {
      // Token invalid/expired -- treat as logged out.
      clearToken("patient");
      setPatient(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken("patient");
    if (!token) {
      setLoading(false);
      return;
    }
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  async function login(email, password) {
    const res = await api.post("/patients/login", { email, password });
    storeToken("patient", res.data.access_token);
    await refreshProfile();
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
    <PatientAuthContext.Provider value={{ patient, loading, login, signup, logout, refreshProfile, authHeaders: () => withAuth("patient") }}>
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  return useContext(PatientAuthContext);
}