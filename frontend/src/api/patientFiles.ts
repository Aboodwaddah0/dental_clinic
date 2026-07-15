import { request } from "./client";
import type { PatientFile } from "../types";
import type { PaginatedResponse } from "./types";

export const listPatientFiles = (params: { patient_id: string; limit?: number; offset?: number }) =>
  request<PaginatedResponse<PatientFile>>("/api/patient-files", { query: params });

export const deletePatientFile = (id: string) =>
  request<void>(`/api/patient-files/${id}`, { method: "DELETE" });
