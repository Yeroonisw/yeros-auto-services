import { createContext, useContext, useMemo, useState } from "react";
import api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("yeros_user"));
    } catch {
      return null;
    }
  });

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("yeros_token", data.token);
    localStorage.setItem("yeros_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("yeros_token");
    localStorage.removeItem("yeros_user");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, login, logout, authenticated: Boolean(user && localStorage.getItem("yeros_token")) }),
    [user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
