import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// Service-role client: bypasses RLS. This must only ever be imported by
// server-side code — authorization is enforced in middleware/auth.ts,
// not by Postgres RLS, for requests that go through this client.
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
