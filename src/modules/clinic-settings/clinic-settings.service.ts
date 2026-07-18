import { supabase } from "../../lib/supabase.js";
import type { UpdateClinicSettingsInput } from "./clinic-settings.schema.js";

const SELECT =
  "clinic_name, address, phone, logo_url, currency, locale, reminders_enabled, reminder_lead_hours";

export async function getClinicSettings() {
  const { data, error } = await supabase
    .from("clinic_settings")
    .select(SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function updateClinicSettings(input: UpdateClinicSettingsInput) {
  const { data, error } = await supabase
    .from("clinic_settings")
    .upsert({
      singleton: 1,
      clinic_name:         input.clinic_name,
      address:             input.address || null,
      phone:               input.phone || null,
      logo_url:            input.logo_url ?? null,
      currency:            input.currency,
      locale:              input.locale,
      reminders_enabled:   input.reminders_enabled,
      reminder_lead_hours: input.reminder_lead_hours,
    })
    .select(SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
