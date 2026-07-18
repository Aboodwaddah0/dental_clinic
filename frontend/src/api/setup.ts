import { request } from "./client";
import type { User } from "../types";

export interface SetupStatus {
  needsSetup: boolean;
  clinic: { clinic_name: string; logo_url: string | null; currency: string; locale: string } | null;
}

export interface SetupPayload {
  owner: { full_name: string; email: string; password: string };
  clinic: { name: string; address?: string; phone?: string; currency: string; locale: string };
  reminders?: {
    enabled: boolean;
    account_sid?: string;
    auth_token?: string;
    whatsapp_from?: string;
    template_sid?: string;
    lead_hours?: number;
  };
}

export interface SetupResponse {
  access_token: string;
  user: User;
  clinic: { clinic_name: string; currency: string; locale: string };
}

export const getSetupStatus = () => request<SetupStatus>("/api/setup/status");

export const submitSetup = (payload: SetupPayload) =>
  request<SetupResponse>("/api/setup", { method: "POST", body: payload });
