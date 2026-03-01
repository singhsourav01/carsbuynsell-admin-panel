import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiUrl } from "./query-client";
import { fetch } from "expo/fetch";

const TOKEN_KEY = "autobid_jwt_token";
const USER_KEY = "autobid_user";

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
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
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

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  return res;
}
