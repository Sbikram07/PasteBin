import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchMe, loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("inkbin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("inkbin_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(emailOrUsername, password) {
    const res = await loginUser({ emailOrUsername, password });
    localStorage.setItem("inkbin_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(username, email, password) {
    const res = await registerUser({ username, email, password });
    localStorage.setItem("inkbin_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("inkbin_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
