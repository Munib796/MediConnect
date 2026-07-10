import { createContext, useContext, useEffect, useState } from "react";
import { api, withAuth, storeToken, clearToken, getStoredToken } from "../lib/api";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken("admin");
    if (!token) {
      setLoading(false);
      return;
    }
    setAdmin({ loggedIn: true });
    setLoading(false);
  }, []);

  async function login(email, password) {
    const res = await api.post("/admin/login", { email, password });
    storeToken("admin", res.data.access_token);
    setAdmin({ loggedIn: true });
    return res.data;
  }

  function logout() {
    clearToken("admin");
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, authHeaders: () => withAuth("admin") }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
