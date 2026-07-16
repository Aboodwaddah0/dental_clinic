import { request } from "./client";

export interface FinancialSummary {
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  invoiceCount: number;
}

export interface MonthlyPoint { month: string; billed: number; collected: number; }
export interface MethodPoint  { method: string; amount: number; }

export interface FinancialReportData {
  summary: FinancialSummary;
  monthly: MonthlyPoint[];
  byMethod: MethodPoint[];
}

export interface PaymentRow {
  id: string;
  patient_name: string;
  amount: number;
  method: string;
  date: string;
  received_by: string;
}

export interface PatientPaymentInvoice {
  id: string; total: number; paid: number; remaining: number;
  status: string; date: string;
  payments: { id: string; amount: number; method: string; date: string; received_by: string }[];
}

export interface PatientPaymentsReportData {
  patient: { full_name: string; phone: string };
  invoices: PatientPaymentInvoice[];
  summary: { totalBilled: number; totalPaid: number; outstanding: number };
}

export interface PatientHistoryReportData {
  patient: { full_name: string; phone: string; date_of_birth?: string; gender?: string; blood_type?: string };
  appointments: { date: string; time: string; status: string; doctor: string; notes: string }[];
  visits:       { date: string; diagnosis: string; treatment: string; notes: string; doctor: string }[];
  dentalRecords:{ date: string; tooth: number; condition: string; treatment: string; status: string; doctor: string }[];
}

export const getFinancialReport = (params: { from?: string; to?: string }) =>
  request<{ data: FinancialReportData }>("/api/reports/financial", { query: params });

export const getPaymentsReport = (params: { from?: string; to?: string; method?: string }) =>
  request<{ data: PaymentRow[]; count: number }>("/api/reports/payments", { query: params });

export const getPatientPaymentsReport = (patientId: string) =>
  request<{ data: PatientPaymentsReportData }>(`/api/reports/patient-payments/${patientId}`);

export const getPatientHistoryReport = (patientId: string) =>
  request<{ data: PatientHistoryReportData }>(`/api/reports/patient-history/${patientId}`);
