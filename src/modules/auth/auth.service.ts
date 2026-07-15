import { supabase } from "../../lib/supabase.js";

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    throw new Error(error?.message ?? "Login failed");
  }

  return { accessToken: data.session.access_token, user: data.user };
}
