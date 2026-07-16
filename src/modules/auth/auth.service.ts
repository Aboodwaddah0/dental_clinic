import { supabase } from "../../lib/supabase.js";

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(error?.message ?? "Login failed");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("No staff profile for this account");
  }

  return { accessToken: data.session.access_token, user: profile };
}
