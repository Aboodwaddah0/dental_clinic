import { supabase } from "../../lib/supabase.js";
import { ConflictError } from "../../lib/errors.js";
import { login } from "../auth/auth.service.js";
import type { SetupBody } from "./setup.schema.js";

export async function getSetupStatus() {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(error.message);

  const needsSetup = (count ?? 0) === 0;

  const { data: settings } = await supabase
    .from("clinic_settings")
    .select("clinic_name, logo_url, currency, locale")
    .maybeSingle();

  return { needsSetup, clinic: settings ?? null };
}

export async function runSetup(body: SetupBody) {
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) throw new ConflictError("Clinic is already set up");

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.owner.email,
    password: body.owner.password,
    email_confirm: true,
  });

  if (authError || !authData.user) throw new Error(authError?.message ?? "Failed to create user");

  const userId = authData.user.id;

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: userId, full_name: body.owner.full_name, email: body.owner.email, role: "doctor" });

  if (profileError) throw new Error(profileError.message);

  const { error: settingsError } = await supabase
    .from("clinic_settings")
    .upsert({
      singleton: 1,
      clinic_name: body.clinic.name,
      address: body.clinic.address ?? null,
      phone: body.clinic.phone ?? null,
      currency: body.clinic.currency,
      locale: body.clinic.locale,
      reminders_enabled: body.reminders?.enabled ?? false,
      twilio_account_sid: body.reminders?.account_sid ?? null,
      twilio_auth_token: body.reminders?.auth_token ?? null,
      twilio_whatsapp_from: body.reminders?.whatsapp_from ?? null,
      twilio_template_sid: body.reminders?.template_sid ?? null,
      reminder_lead_hours: body.reminders?.lead_hours ?? 24,
      is_setup_complete: true,
    });

  if (settingsError) throw new Error(settingsError.message);

  const { accessToken, user } = await login(body.owner.email, body.owner.password);

  return {
    access_token: accessToken,
    user,
    clinic: { clinic_name: body.clinic.name, currency: body.clinic.currency, locale: body.clinic.locale },
  };
}
