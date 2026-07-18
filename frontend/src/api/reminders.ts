import { request } from "./client";

export interface ReminderEntry {
  id: string;
  appointment_date: string;
  start_time: string;
  reminder_status: "pending" | "sent" | "failed" | "skipped";
  reminded_at: string | null;
  reminder_error: string | null;
  patient_name: string | null;
  patient_phone: string | null;
}

export const listReminders = () =>
  request<{ data: ReminderEntry[] }>("/api/reminders");
