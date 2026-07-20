import { request, getAuthToken } from "./client";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface ClinicService {
  id: string; title: string; description?: string; icon?: string; sort_order: number;
}
export type PortfolioTemplate = "single" | "before-after" | "gallery";

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  before_image_url?: string;
  after_image_url?: string;
  template: PortfolioTemplate;
  sort_order: number;
}

export const uploadPortfolioImage = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/api/landing/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  const json = await res.json();
  return json.url as string;
};
export interface BusinessHourRow {
  day: string; enabled: boolean; start_time: string; end_time: string;
}
export interface LandingData {
  clinic: { clinic_name: string; address?: string; phone?: string; logo_url?: string; hero_image_url?: string; hero_bg_url?: string } | null;
  services: ClinicService[];
  portfolio: PortfolioItem[];
  businessHours: BusinessHourRow[];
}

export const getLanding = () =>
  request<{ data: LandingData }>("/api/landing");

export const createService    = (body: Omit<ClinicService, "id">) =>
  request<{ data: ClinicService }>("/api/landing/services", { method: "POST", body });
export const updateService    = (id: string, body: Omit<ClinicService, "id">) =>
  request<{ data: ClinicService }>(`/api/landing/services/${id}`, { method: "PUT", body });
export const deleteService    = (id: string) =>
  request<void>(`/api/landing/services/${id}`, { method: "DELETE" });

export const createPortfolio  = (body: Omit<PortfolioItem, "id">) =>
  request<{ data: PortfolioItem }>("/api/landing/portfolio", { method: "POST", body });
export const updatePortfolio  = (id: string, body: Omit<PortfolioItem, "id">) =>
  request<{ data: PortfolioItem }>(`/api/landing/portfolio/${id}`, { method: "PUT", body });
export const deletePortfolio  = (id: string) =>
  request<void>(`/api/landing/portfolio/${id}`, { method: "DELETE" });
