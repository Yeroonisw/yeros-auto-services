import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!user) return undefined;
    let timer;
    const expire = () => {
      localStorage.removeItem("yeros_token");
      localStorage.removeItem("yeros_user");
      setUser(null);
      window.location.assign("/login?reason=inactive");
    };
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(expire, 30 * 60 * 1000);
    };
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [user]);

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
