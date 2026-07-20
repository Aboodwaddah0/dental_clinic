export interface User {
  id: string;
  role: "doctor";
  full_name: string;
}

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  address: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_notes: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  // Not returned by the real API — only present on mock data consumed by
  // pages not yet wired to the backend (Dashboard, Billing, PatientDetail's
  // appointments tab). New code should resolve names client-side instead.
  patient_name?: string;
  doctor_id: string;
  doctor_name?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
}

export interface Visit {
  id: string;
  patient_id: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  date: string;
  doctor: string;
}

export interface DentalRecord {
  id: string;
  patient_id: string;
  tooth_number: number;
  condition: string;
  description: string;
  treatment: string;
  status: "healthy" | "caries" | "treated" | "missing" | "extracted" | "needs_treatment";
  date: string;
  doctor: string;
}

export interface PatientFile {
  id: string;
  patient_id: string;
  file_url: string;
  file_type: "xray" | "image" | "pdf";
  description: string;
  uploaded_by: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  patient_name: string | null;
  total_amount: number;
  paid_amount: number;
  status: "unpaid" | "partially_paid" | "paid";
  created_at: string;
  note?: string | null;
  payments: Payment[];
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: "cash" | "card" | "transfer";
  payment_date: string;
  received_by: string;
  note?: string | null;
}

export interface AvailabilitySlot {
  day: string;
  start_time: string;
  end_time: string;
  enabled: boolean;
}
