import { request } from "./client";
import type { User } from "../types";

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const login = (email: string, password: string) =>
  request<LoginResponse>("/api/auth/login", { method: "POST", body: { email, password } });

export const getMe = () => request<{ user: User }>("/api/auth/me");
