import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types";
import { getMe, login as apiLogin } from "../api/auth";
import { setAuthToken, setUnauthorizedHandler } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  canCreate: () => boolean;
  canEdit: () => boolean;
  canDelete: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem("dc_token");
    localStorage.removeItem("dc_user");
  };

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("dc_token");
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setAuthToken(savedToken);
    getMe()
      .then(({ user: revalidatedUser }) => {
        setToken(savedToken);
        setUser(revalidatedUser);
        localStorage.setItem("dc_user", JSON.stringify(revalidatedUser));
      })
      .catch(() => {
        setAuthToken(null);
        localStorage.removeItem("dc_token");
        localStorage.removeItem("dc_user");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token, user: loggedInUser } = await apiLogin(email, password);
    setAuthToken(access_token);
    setUser(loggedInUser);
    setToken(access_token);
    localStorage.setItem("dc_token", access_token);
    localStorage.setItem("dc_user", JSON.stringify(loggedInUser));
  };

  const canCreate = () => user?.role === "doctor";
  const canEdit = () => user?.role === "doctor";
  const canDelete = () => user?.role === "doctor";

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, canCreate, canEdit, canDelete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
