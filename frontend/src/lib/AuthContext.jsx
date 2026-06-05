import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

function savedUser() {
  try {
    const saved = localStorage.getItem("pinoxx_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem("pinoxx_user");
    localStorage.removeItem("pinoxx_token");
    return null;
  }
}

function rememberUser(user) {
  try {
    localStorage.setItem("pinoxx_user", JSON.stringify(user));
  } catch {
    // Ignore storage failures; the in-memory session still works for this page load.
  }
}

function rememberLoginPrompt() {
  try {
    sessionStorage.setItem("pinoxx_show_whatsapp_support", "1");
  } catch {
    // Non-critical prompt state.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(savedUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("pinoxx_token");
    if (!token) return;

    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        rememberUser(data.user);
      })
      .catch(() => logout());
  }, []);

  async function login(payload) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", payload);
      localStorage.setItem("pinoxx_token", data.token);
      rememberUser(data.user);
      rememberLoginPrompt();
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function signup(payload) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", payload);
      localStorage.setItem("pinoxx_token", data.token);
      rememberUser(data.user);
      rememberLoginPrompt();
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin(credential) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { credential });
      localStorage.setItem("pinoxx_token", data.token);
      rememberUser(data.user);
      rememberLoginPrompt();
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("pinoxx_token");
    localStorage.removeItem("pinoxx_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, signup, googleLogin, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
