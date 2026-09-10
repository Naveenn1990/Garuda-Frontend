// Minimal global auth state via React Context. Server data is handled by React Query;
// this store only tracks the authenticated user and login/logout actions.
import { createContext, useContext, useEffect, useState } from "react";
import authService from "../../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, if a token exists try to load the current user.
    async function bootstrap() {
      if (authService.isAuthenticated()) {
        try {
          const me = await authService.me();
          setUser(me);
        } catch {
          authService.logout();
        }
      }
      setLoading(false);
    }
    bootstrap();
  }, []);

  async function login(credentials) {
    const data = await authService.login(credentials);
    setUser(data.user ?? null);
    return data;
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  const value = { user, loading, login, logout, isAuthenticated: Boolean(user) };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
