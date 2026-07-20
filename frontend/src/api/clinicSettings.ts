import { request } from "./client";

export interface ClinicSettings {
  clinic_name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_bg_url: string | null;
  currency: string;
  locale: string;
  reminders_enabled: boolean;
  reminder_lead_hours: number;
}

export type UpdateClinicSettingsBody = ClinicSettings & { clinic_name: string };

export const getClinicSettings = () =>
  request<ClinicSettings | null>("/api/clinic-settings");

export const updateClinicSettings = (body: Partial<UpdateClinicSettingsBody> & { clinic_name: string }) =>
  request<ClinicSettings>("/api/clinic-settings", { method: "PUT", body });
