import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiUrl } from "./query-client";
import { fetch } from "expo/fetch";

const TOKEN_KEY = "carsbuynsell_jwt_token";
const REFRESH_TOKEN_KEY = "carsbuynsell_refresh_token";
const USER_KEY = "carsbuynsell_user";

// ─── Storage helpers ─────────────────────────────────────────────

export async function storeToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}

export async function storeRefreshToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function storeUser(user: object): Promise<void> {
  const json = JSON.stringify(user);
  if (Platform.OS === "web") {
    localStorage.setItem(USER_KEY, json);
  } else {
    await SecureStore.setItemAsync(USER_KEY, json);
  }
}

export async function getUser(): Promise<Record<string, string> | null> {
  let json: string | null;
  if (Platform.OS === "web") {
    json = localStorage.getItem(USER_KEY);
  } else {
    json = await SecureStore.getItemAsync(USER_KEY);
  }
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ─── Auth base URL helper ──────────────────────────────────────

function getAuthBaseUrl(): string {
  const domain =
    process.env.EXPO_PUBLIC_AUTH_DOMAIN ||
    (process.env.EXPO_PUBLIC_DOMAIN
      ? process.env.EXPO_PUBLIC_DOMAIN.replace(":3002", ":3001")
      : "65.2.10.30:3001");

  try {
    const isIpOrLocal =
      domain.includes("localhost") || domain.match(/^\d+\.\d+\.\d+\.\d+/);
    const protocol = isIpOrLocal ? "http" : "https";
    return new URL(`${protocol}://${domain}`).href;
  } catch {
    return "http://65.2.10.30:3001/";
  }
}

// ─── Logout callback (wired up in AuthContext) ──────────────────

let logoutCallback: (() => void) | null = null;

export function setOnLogoutCallback(cb: () => void) {
  logoutCallback = cb;
}

// ─── Refresh-token machinery ────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

function isRefreshEndpoint(url: string): boolean {
  return url.includes("/refresh-token") || url.includes("/auth/refresh");
}

export async function refreshAccessToken(): Promise<boolean> {
  // If another request is already refreshing, wait for it.
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;

      const baseUrl = getAuthBaseUrl();
      const url = new URL("/auth/refresh-token", baseUrl);

      const res = await fetch(url.toString(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      const newAccessToken =
        data?.data?.access_token || data?.access_token || data?.token || data?.data?.token;
      const newRefreshToken =
        data?.data?.refresh_token || data?.refresh_token || data?.data?.uld_refresh_token;

      if (newAccessToken && typeof newAccessToken === "string") {
        await storeToken(newAccessToken);
        if (newRefreshToken && typeof newRefreshToken === "string") {
          await storeRefreshToken(newRefreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function fetchWithRetry(
  url: string,
  options: { method: string; headers: Record<string, string>; body?: string },
  requiresAuth: boolean
): Promise<Response> {
  const res = await fetch(url, options);

  // If we got a 401 on an authenticated request (and it's not the refresh call itself),
  // try to refresh the access token and replay once.
  if (res.status === 401 && requiresAuth && !isRefreshEndpoint(url)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const token = await getToken();
      const newHeaders = { ...(options.headers as Record<string, string>) };
      if (token) newHeaders["Authorization"] = `Bearer ${token}`;
      return fetch(url, { ...options, headers: newHeaders });
    }

    // Refresh failed → clear everything and force logout
    await deleteToken();
    logoutCallback?.();
  }

  return res;
}

// ─── Request wrappers (with automatic 401 refresh) ──────────────

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown,
  requiresAuth = true,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const headers: Record<string, string> = {};

  if (data) headers["Content-Type"] = "application/json";

  if (requiresAuth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  return fetchWithRetry(url.toString(), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  }, requiresAuth);
}

export async function apiRequestDirect(
  method: string,
  fullUrl: string,
  data?: unknown,
  requiresAuth = false,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";

  if (requiresAuth) {
    const token = await getToken();
    console.log("=== AUTH TOKEN FOR REQUEST ===", fullUrl, token ? `Bearer ${token.substring(0, 20)}...` : "NO TOKEN FOUND");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  return fetchWithRetry(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  }, requiresAuth);
}
