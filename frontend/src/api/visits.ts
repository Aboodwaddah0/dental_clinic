import { request } from "./client";
import type { Visit } from "../types";
import type { PaginatedResponse } from "./types";

export interface VisitInput {
  patient_id: string;
  appointment_id?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}

export const listVisits = (params: { patient_id: string; limit?: number; offset?: number }) =>
  request<PaginatedResponse<Visit>>("/api/visits", { query: params });

export const getVisit = (id: string) =>
  request<{ data: Visit }>(`/api/visits/${id}`);

export const createVisit = (input: VisitInput) =>
  request<{ data: Visit }>("/api/visits", { method: "POST", body: input });

export const updateVisit = (id: string, input: Partial<Omit<VisitInput, "patient_id">>) =>
  request<{ data: Visit }>(`/api/visits/${id}`, { method: "PUT", body: input });

export const deleteVisit = (id: string) =>
  request<void>(`/api/visits/${id}`, { method: "DELETE" });
