import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { getToken, getUser, deleteToken, storeToken, storeUser, storeRefreshToken, getRefreshToken, setOnLogoutCallback } from "@/lib/auth";
import {
  registerForPushNotifications,
  setupPushNotificationListeners,
} from "@/lib/push-notifications";
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

  // Wire up the global logout callback so the auto-refresh logic
  // can force a logout + redirect when the refresh token itself is dead.
  useEffect(() => {
    setOnLogoutCallback(() => {
      deleteToken();
      setToken(null);
      setRToken(null);
      setUser(null);
      router.replace("/(auth)/login");
    });
  }, []);

  // Keep the backend's FCM token up to date for the signed-in user, and
  // listen for incoming/refreshed tokens while the app is running.
  useEffect(() => {
    if (isLoading || !token || !user) return;

    const userRecord = user as unknown as Record<string, unknown>;
    const userId = userRecord.id || userRecord.user_id || userRecord.uld_user_id;
    if (!userId) return;

    const params = {
      userId: String(userId),
      accessToken: token,
      refreshToken: rToken,
    };

    registerForPushNotifications(params, { requestPermission: true }).catch(
      (error) => console.log("[push] Registration failed:", error),
    );

    return setupPushNotificationListeners(params);
  }, [isLoading, token, user, rToken]);

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
