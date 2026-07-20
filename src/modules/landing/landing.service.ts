import { supabase } from "../../lib/supabase.js";
import type { ServiceInput, PortfolioInput } from "./landing.schema.js";

export async function getLandingData() {
  const [
    { data: clinic  },
    { data: services },
    { data: portfolio },
    { data: hours },
  ] = await Promise.all([
    supabase.from("clinic_settings").select("clinic_name, address, phone, logo_url, hero_image_url, hero_bg_url").maybeSingle(),
    supabase.from("clinic_services").select("id, title, description, icon, sort_order").order("sort_order"),
    supabase.from("clinic_portfolio").select("id, title, description, image_url, before_image_url, after_image_url, template, sort_order").order("sort_order"),
    supabase
      .from("doctor_availability")
      .select("day, start_time, end_time, enabled")
      .eq("enabled", true),
  ]);

  // Aggregate hours: for each day, pick earliest start / latest end across all doctors
  const DAY_ORDER = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayMap: Record<string, { start: string; end: string }> = {};
  for (const row of hours ?? []) {
    const existing = dayMap[row.day];
    if (!existing || row.start_time < existing.start) {
      dayMap[row.day] = { start: row.start_time, end: row.end_time };
    } else if (row.end_time > existing.end) {
      dayMap[row.day].end = row.end_time;
    }
  }
  const businessHours = DAY_ORDER.map((day) => ({
    day,
    enabled:    !!dayMap[day],
    start_time: dayMap[day]?.start ?? "09:00",
    end_time:   dayMap[day]?.end   ?? "17:00",
  }));

  return { clinic, services: services ?? [], portfolio: portfolio ?? [], businessHours };
}

// ── Services ────────────────────────────────────────────────────────────────

export async function createService(input: ServiceInput) {
  const { data, error } = await supabase.from("clinic_services").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateService(id: string, input: ServiceInput) {
  const { data, error } = await supabase.from("clinic_services").update(input).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteService(id: string) {
  const { error } = await supabase.from("clinic_services").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Portfolio ────────────────────────────────────────────────────────────────

export async function createPortfolioItem(input: PortfolioInput) {
  const { data, error } = await supabase.from("clinic_portfolio").insert({
    title:            input.title,
    description:      input.description,
    image_url:        input.image_url        || null,
    before_image_url: input.before_image_url || null,
    after_image_url:  input.after_image_url  || null,
    template:         input.template,
    sort_order:       input.sort_order,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePortfolioItem(id: string, input: PortfolioInput) {
  const { data, error } = await supabase.from("clinic_portfolio").update({
    title:            input.title,
    description:      input.description,
    image_url:        input.image_url        || null,
    before_image_url: input.before_image_url || null,
    after_image_url:  input.after_image_url  || null,
    template:         input.template,
    sort_order:       input.sort_order,
  }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deletePortfolioItem(id: string) {
  const { error } = await supabase.from("clinic_portfolio").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
