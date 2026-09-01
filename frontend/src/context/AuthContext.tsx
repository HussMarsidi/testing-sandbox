import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest, logout as logoutRequest } from "../lib/api";
import { getAuthToken, type UserRole } from "../lib/auth-storage";
import { getRoleFromToken } from "../lib/jwt";

interface AuthContextValue {
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());

  const role = useMemo(() => getRoleFromToken(token), [token]);

  const login = useCallback(async (username: string, password: string) => {
    await loginRequest({ username, password });
    const nextToken = getAuthToken();
    setToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token),
      isAdmin: role === "admin",
      login,
      logout,
    }),
    [login, logout, role, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
