import { request } from "./client";
import type { DentalRecord } from "../types";
import type { PaginatedResponse } from "./types";

export interface DentalRecordInput {
  patient_id: string;
  tooth_number: number;
  condition?: string;
  description?: string;
  treatment?: string;
  status?: "active" | "resolved" | "extracted";
}

export const listDentalRecords = (params: { patient_id: string; limit?: number; offset?: number }) =>
  request<PaginatedResponse<DentalRecord>>("/api/dental-records", { query: params });

export const createDentalRecord = (input: DentalRecordInput) =>
  request<{ data: DentalRecord }>("/api/dental-records", { method: "POST", body: input });

export const updateDentalRecord = (id: string, input: Partial<Omit<DentalRecordInput, "patient_id">>) =>
  request<{ data: DentalRecord }>(`/api/dental-records/${id}`, { method: "PUT", body: input });

export const deleteDentalRecord = (id: string) =>
  request<void>(`/api/dental-records/${id}`, { method: "DELETE" });
