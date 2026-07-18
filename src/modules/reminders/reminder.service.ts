import { supabase } from "../../lib/supabase.js";

export async function listUpcomingReminders(days = 7) {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, appointment_date, start_time, reminder_status, reminded_at, reminder_error, " +
      "patient:patients!patient_id(full_name, phone)"
    )
    .eq("status", "scheduled")
    .gte("appointment_date", from)
    .lte("appointment_date", to)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((a: any) => ({
    id: a.id,
    appointment_date: a.appointment_date,
    start_time: a.start_time,
    reminder_status: a.reminder_status,
    reminded_at: a.reminded_at,
    reminder_error: a.reminder_error,
    patient_name: a.patient?.full_name ?? null,
    patient_phone: a.patient?.phone ?? null,
  }));
}
