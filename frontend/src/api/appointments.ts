import { request } from "./client";
import type { Appointment } from "../types";
import type { PaginatedResponse } from "./types";

export interface AppointmentInput {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface AppointmentUpdateInput {
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  status?: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

export const listAppointments = (params: {
  doctor_id?: string;
  patient_id?: string;
  status?: "scheduled" | "completed" | "cancelled";
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) => request<PaginatedResponse<Appointment>>("/api/appointments", { query: params });

export const getAppointment = (id: string) => request<{ data: Appointment }>(`/api/appointments/${id}`);

export const createAppointment = (input: AppointmentInput) =>
  request<{ data: Appointment }>("/api/appointments", { method: "POST", body: input });

export const updateAppointment = (id: string, input: AppointmentUpdateInput) =>
  request<{ data: Appointment }>(`/api/appointments/${id}`, { method: "PATCH", body: input });
