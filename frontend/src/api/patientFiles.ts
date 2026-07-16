import { request } from "./client";
import type { PatientFile } from "../types";
import type { PaginatedResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function uploadPatientFile(
  file: File,
  patient_id: string,
  file_type: "xray" | "image" | "pdf",
  description: string
): Promise<{ data: PatientFile }> {
  const token = localStorage.getItem("dc_token");
  const form = new FormData();
  form.append("file", file);
  form.append("patient_id", patient_id);
  form.append("file_type", file_type);
  form.append("description", description);

  const res = await fetch(`${BASE_URL}/api/patient-files/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json;
}

export const listPatientFiles = (params: { patient_id: string; limit?: number; offset?: number }) =>
  request<PaginatedResponse<PatientFile>>("/api/patient-files", { query: params });

export const deletePatientFile = (id: string) =>
  request<void>(`/api/patient-files/${id}`, { method: "DELETE" });
