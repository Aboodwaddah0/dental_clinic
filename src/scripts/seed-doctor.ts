// One-off dev script: creates (or reuses) a test doctor account so you have
// something to log in with locally. Run with: npm run seed:doctor
import { supabase } from "../lib/supabase.js";

const email = process.env.SEED_DOCTOR_EMAIL ?? "doctor@example.com";
const password = process.env.SEED_DOCTOR_PASSWORD ?? "password123";
const fullName = process.env.SEED_DOCTOR_NAME ?? "Dr. Test Doctor";

async function main() {
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw new Error(listError.message);

  let userId = existing.users.find((u) => u.email === email)?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(error?.message ?? "Failed to create auth user");
    userId = data.user.id;
    console.log(`Created auth user ${email} (${userId})`);
  } else {
    console.log(`Auth user ${email} already exists (${userId})`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, role: "doctor" }, { onConflict: "id" });

  if (profileError) throw new Error(profileError.message);

  console.log(`Doctor profile ready for ${email}`);
  console.log(`Login with: POST /api/auth/login { "email": "${email}", "password": "${password}" }`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
