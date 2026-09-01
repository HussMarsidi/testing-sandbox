import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest, logout as logoutRequest } from "../lib/api";
import { getAuthToken, setAuthToken } from "../lib/auth-storage";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());

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
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [login, logout, token],
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

export function setAuthenticatedToken(token: string): void {
  setAuthToken(token);
}
