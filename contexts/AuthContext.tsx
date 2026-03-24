import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { getToken, getUser, deleteToken, storeToken, storeUser, storeRefreshToken, getRefreshToken } from "@/lib/auth";
import { router } from "expo-router";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rToken, setRToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser, storedRefresh] = await Promise.all([
          getToken(), getUser(), getRefreshToken(),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser as unknown as User);
          if (storedRefresh) setRToken(storedRefresh);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (newToken: string, newUser: User, newRefreshToken?: string) => {
    const promises: Promise<void>[] = [storeToken(newToken), storeUser(newUser)];
    if (newRefreshToken) promises.push(storeRefreshToken(newRefreshToken));
    await Promise.all(promises);
    setToken(newToken);
    setUser(newUser);
    if (newRefreshToken) setRToken(newRefreshToken);
  };

  const logout = async () => {
    await deleteToken();
    setToken(null);
    setRToken(null);
    setUser(null);
    router.replace("/(auth)/login");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      refreshToken: rToken,
      isLoading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
    }),
    [user, token, rToken, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
