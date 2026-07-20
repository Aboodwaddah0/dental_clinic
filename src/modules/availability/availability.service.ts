import { supabase } from "../../lib/supabase.js";
import { DAYS, type SlotInput } from "./availability.schema.js";

const DEFAULT_SLOTS = DAYS.map((day) => ({
  day,
  start_time: "09:00",
  end_time:   "17:00",
  enabled:    day !== "Friday" && day !== "Saturday",
}));

export async function getAvailability(doctorId: string) {
  const { data, error } = await supabase
    .from("doctor_availability")
    .select("day, start_time, end_time, enabled")
    .eq("doctor_id", doctorId)
    .order("day");

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) return DEFAULT_SLOTS;

  // Merge DB rows into the canonical day order
  const map = Object.fromEntries(data.map((r) => [r.day, r]));
  return DAYS.map((day) => map[day] ?? { day, start_time: "09:00", end_time: "17:00", enabled: false });
}

export async function upsertAvailability(doctorId: string, slots: SlotInput[]) {
  const rows = slots.map((s) => ({ ...s, doctor_id: doctorId }));

  const { error } = await supabase
    .from("doctor_availability")
    .upsert(rows, { onConflict: "doctor_id,day" });

  if (error) throw new Error(error.message);

  return getAvailability(doctorId);
}
