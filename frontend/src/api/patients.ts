import { request } from "./client";
import type { Patient } from "../types";
import type { PaginatedResponse } from "./types";

export interface PatientInput {
  full_name: string;
  phone: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  blood_type?: string;
  allergies?: string;
  medical_notes?: string;
}

export const listPatients = (params: { search?: string; limit?: number; offset?: number }) =>
  request<PaginatedResponse<Patient>>("/api/patients", { query: params });

export const getPatient = (id: string) => request<{ data: Patient }>(`/api/patients/${id}`);

export const createPatient = (input: PatientInput) =>
  request<{ data: Patient }>("/api/patients", { method: "POST", body: input });

export const updatePatient = (id: string, input: Partial<PatientInput>) =>
  request<{ data: Patient }>(`/api/patients/${id}`, { method: "PATCH", body: input });

export const deletePatient = (id: string) => request<void>(`/api/patients/${id}`, { method: "DELETE" });
