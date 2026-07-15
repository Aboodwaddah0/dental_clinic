import { ApiError, type ApiErrorBody } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    });
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      setAuthToken(null);
      onUnauthorized?.();
    }
    throw new ApiError(res.status, (json.error as ApiErrorBody) ?? "Request failed");
  }

  return json as T;
}
