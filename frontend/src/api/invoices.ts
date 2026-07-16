import { request } from "./client";
import type { Invoice } from "../types";
import type { PaginatedResponse } from "./types";

export interface PaymentInput {
  amount: number;
  payment_method: "cash" | "card" | "transfer";
  payment_date?: string;
}

export interface InvoiceInput {
  patient_id: string;
  total_amount: number;
}

export const listInvoices = (params?: { patient_id?: string; status?: string; limit?: number; offset?: number }) =>
  request<PaginatedResponse<Invoice>>("/api/invoices", { query: params });

export const getPatientBalances = (patientIds: string[]) =>
  request<{ data: Record<string, number> }>("/api/invoices/balances", {
    query: { patient_ids: patientIds.join(",") },
  });

export const getInvoice = (id: string) =>
  request<{ data: Invoice }>(`/api/invoices/${id}`);

export const createInvoice = (input: InvoiceInput) =>
  request<{ data: Invoice }>("/api/invoices", { method: "POST", body: input });

export const updateInvoice = (id: string, input: { total_amount?: number }) =>
  request<{ data: Invoice }>(`/api/invoices/${id}`, { method: "PUT", body: input });

export const deleteInvoice = (id: string) =>
  request<void>(`/api/invoices/${id}`, { method: "DELETE" });

export const addPayment = (invoiceId: string, input: PaymentInput) =>
  request<{ data: Invoice }>(`/api/invoices/${invoiceId}/payments`, { method: "POST", body: input });
