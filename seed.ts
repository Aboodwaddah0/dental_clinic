import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  // ── 1. Get existing doctor user ───────────────────────────────────────────
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) { console.error("List users error:", usersErr.message); process.exit(1); }

  const doctor = users.users[0];
  if (!doctor) { console.error("No users found — create a doctor account first via /register"); process.exit(1); }
  console.log(`Using doctor: ${doctor.email} (${doctor.id})`);

  // ── 2. Clear existing data (order matters for FK constraints) ─────────────
  console.log("Clearing old data...");
  await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("visits").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("appointments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("patient_files").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("patients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Old data cleared.");

  // ── 3. Patients ───────────────────────────────────────────────────────────
  const { data: patients, error: pErr } = await supabase.from("patients").insert([
    {
      full_name: "محمد خالد أبو عمر",
      phone: "0591234567",
      date_of_birth: "1985-03-12",
      gender: "male",
      blood_type: "O+",
      allergies: "البنسلين",
      medical_notes: "مريض بالسكري — يجب مراقبة التئام الجروح بعناية.",
      registered_by: doctor.id,
    },
    {
      full_name: "فاطمة يوسف البرغوثي",
      phone: "0597654321",
      date_of_birth: "1992-07-28",
      gender: "female",
      blood_type: "A+",
      allergies: null,
      medical_notes: "قلق خفيف — يُنصح بالطمأنة قبل الإجراءات.",
      registered_by: doctor.id,
    },
    {
      full_name: "عمر حسين الجعبري",
      phone: "0599876543",
      date_of_birth: "1970-11-05",
      gender: "male",
      blood_type: "B+",
      allergies: "اللاتكس",
      medical_notes: "ضغط دم مرتفع — يجب قياس الضغط قبل الخلع.",
      registered_by: doctor.id,
    },
    {
      full_name: "نور أحمد حمدان",
      phone: "0561122334",
      date_of_birth: "2000-01-15",
      gender: "female",
      blood_type: "AB-",
      allergies: null,
      medical_notes: null,
      registered_by: doctor.id,
    },
    {
      full_name: "يوسف إبراهيم عساف",
      phone: "0584455667",
      date_of_birth: "1978-09-22",
      gender: "male",
      blood_type: "A-",
      allergies: null,
      medical_notes: "يعاني من حساسية في اللثة.",
      registered_by: doctor.id,
    },
    {
      full_name: "ريم وليد ناصر",
      phone: "0578899001",
      date_of_birth: "1995-05-30",
      gender: "female",
      blood_type: "O-",
      allergies: "مضادات الالتهاب",
      medical_notes: "سبق إجراء تقويم أسنان.",
      registered_by: doctor.id,
    },
  ]).select();

  if (pErr) { console.error("Patients error:", pErr.message); process.exit(1); }
  console.log(`Inserted ${patients.length} patients`);

  const [mohammad, fatima, omar, noura, yousef, reem] = patients;

  // ── 4. Appointments ───────────────────────────────────────────────────────
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  const { error: aErr } = await supabase.from("appointments").insert([
    { patient_id: mohammad.id, doctor_id: doctor.id, appointment_date: fmt(today), start_time: "09:00", end_time: "09:30", status: "scheduled", notes: "فحص دوري وتنظيف" },
    { patient_id: fatima.id,   doctor_id: doctor.id, appointment_date: fmt(today), start_time: "10:00", end_time: "10:45", status: "scheduled", notes: "حشو ضرس العقل" },
    { patient_id: noura.id,    doctor_id: doctor.id, appointment_date: fmt(addDays(today, 1)), start_time: "11:00", end_time: "11:30", status: "scheduled", notes: "متابعة بعد التبييض" },
    { patient_id: omar.id,     doctor_id: doctor.id, appointment_date: fmt(addDays(today, -2)), start_time: "14:00", end_time: "14:30", status: "completed", notes: "تركيب تاج خزفي" },
    { patient_id: yousef.id,   doctor_id: doctor.id, appointment_date: fmt(addDays(today, -5)), start_time: "09:30", end_time: "10:00", status: "completed", notes: "علاج جذور الضرس السادس" },
    { patient_id: reem.id,     doctor_id: doctor.id, appointment_date: fmt(addDays(today, -1)), start_time: "15:00", end_time: "15:30", status: "cancelled", notes: "تقييم التقويم" },
    { patient_id: fatima.id,   doctor_id: doctor.id, appointment_date: fmt(addDays(today, 3)), start_time: "12:00", end_time: "12:30", status: "scheduled", notes: "متابعة الحشو" },
  ]);
  if (aErr) { console.error("Appointments error:", aErr.message); process.exit(1); }
  console.log("Inserted 7 appointments");

  // ── 5. Visits ─────────────────────────────────────────────────────────────
  const { error: vErr } = await supabase.from("visits").insert([
    { patient_id: mohammad.id, doctor_id: doctor.id, diagnosis: "التهاب اللثة المزمن", treatment: "تنظيف عميق وكشط اللثة", notes: "يُنصح بالتفريش مرتين يومياً واستخدام خيط الأسنان. مراجعة بعد 3 أشهر." },
    { patient_id: fatima.id,   doctor_id: doctor.id, diagnosis: "تسوس في الضرس الرابع العلوي", treatment: "حشو كومبوزيت", notes: "تمت إزالة التسوس وتطبيق الحشوة بنجاح. لا ألم بعد الإجراء." },
    { patient_id: omar.id,     doctor_id: doctor.id, diagnosis: "فقدان الضرس السادس السفلي", treatment: "تركيب تاج خزفي على زرع سابق", notes: "تم تثبيت التاج بدقة. تجنب الأطعمة الصلبة 72 ساعة." },
    { patient_id: noura.id,    doctor_id: doctor.id, diagnosis: "تآكل مينا الأسنان", treatment: "تطبيق الفلورايد وطلاء واقٍ", notes: "يُنصح بتقليل المشروبات الحمضية. متابعة بعد شهرين." },
    { patient_id: yousef.id,   doctor_id: doctor.id, diagnosis: "التهاب في لب الضرس السادس", treatment: "علاج عصب (قناة جذر)", notes: "تم تنظيف القنوات وإغلاقها. توصف مضادات حيوية لمدة 5 أيام." },
  ]);
  if (vErr) { console.error("Visits error:", vErr.message); process.exit(1); }
  console.log("Inserted 5 visits");

  // ── 6. Invoices ───────────────────────────────────────────────────────────
  const { data: invoices, error: iErr } = await supabase.from("invoices").insert([
    { patient_id: mohammad.id, total_amount: 800,  paid_amount: 800,  status: "paid" },
    { patient_id: fatima.id,   total_amount: 1200, paid_amount: 600,  status: "partially_paid" },
    { patient_id: omar.id,     total_amount: 3500, paid_amount: 0,    status: "unpaid" },
    { patient_id: noura.id,    total_amount: 450,  paid_amount: 450,  status: "paid" },
    { patient_id: yousef.id,   total_amount: 1800, paid_amount: 1000, status: "partially_paid" },
    { patient_id: reem.id,     total_amount: 2200, paid_amount: 2200, status: "paid" },
  ]).select();
  if (iErr) { console.error("Invoices error:", iErr.message); process.exit(1); }
  console.log(`Inserted ${invoices.length} invoices`);

  // ── 7. Payments ───────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const weekAgo = addDays(today, -7).toISOString();
  const twoWeeksAgo = addDays(today, -14).toISOString();

  const { error: payErr } = await supabase.from("payments").insert([
    // محمد — مدفوع بالكامل
    { invoice_id: invoices[0].id, amount: 800,  payment_method: "card",     payment_date: weekAgo,      received_by: doctor.id },
    // فاطمة — جزئي
    { invoice_id: invoices[1].id, amount: 600,  payment_method: "cash",     payment_date: now,           received_by: doctor.id },
    // نورة — مدفوع بالكامل بدفعتين
    { invoice_id: invoices[3].id, amount: 250,  payment_method: "cash",     payment_date: twoWeeksAgo,  received_by: doctor.id },
    { invoice_id: invoices[3].id, amount: 200,  payment_method: "transfer", payment_date: weekAgo,      received_by: doctor.id },
    // يوسف — جزئي بدفعتين
    { invoice_id: invoices[4].id, amount: 500,  payment_method: "cash",     payment_date: twoWeeksAgo,  received_by: doctor.id },
    { invoice_id: invoices[4].id, amount: 500,  payment_method: "card",     payment_date: weekAgo,      received_by: doctor.id },
    // ريم — مدفوع بالكامل
    { invoice_id: invoices[5].id, amount: 2200, payment_method: "transfer", payment_date: twoWeeksAgo,  received_by: doctor.id },
  ]);
  if (payErr) { console.error("Payments error:", payErr.message); process.exit(1); }
  console.log("Inserted 7 payments");

  console.log("\n✓ Seed complete!");
}

seed().catch(console.error);
