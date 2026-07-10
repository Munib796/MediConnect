import { createContext, useContext, useEffect, useState } from "react";
import { api, withAuth, storeToken, clearToken, getStoredToken } from "../lib/api";

const DoctorAuthContext = createContext(null);

export function DoctorAuthProvider({ children }) {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken("doctor");
    if (!token) {
      setLoading(false);
      return;
    }
    setDoctor({ loggedIn: true });
    setLoading(false);
  }, []);

  async function login(email, password) {
    const res = await api.post("/doctors/login", { email, password });
    storeToken("doctor", res.data.access_token);
    setDoctor({ loggedIn: true });
    return res.data;
  }

  async function signup(payload) {
    const res = await api.post("/doctors/signup", payload);
    return res.data;
  }

  function logout() {
    clearToken("doctor");
    setDoctor(null);
  }

  return (
    <DoctorAuthContext.Provider value={{ doctor, loading, login, signup, logout, authHeaders: () => withAuth("doctor") }}>
      {children}
    </DoctorAuthContext.Provider>
  );
}

export function useDoctorAuth() {
  return useContext(DoctorAuthContext);
}
