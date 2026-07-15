-- Row Level Security: single-role clinic model. There is only one staff
-- role ('doctor'), so the read/write split is simple: any authenticated
-- Supabase user can read data, but writes require an actual doctor profile
-- row (current_staff_role() = 'doctor', defined in
-- 20260712000019_profiles_and_patients.sql).

alter table profiles enable row level security;
create policy profiles_read on profiles for select using (auth.role() = 'authenticated');
create policy profiles_write on profiles for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

alter table patients enable row level security;
create policy patients_read on patients for select using (auth.role() = 'authenticated');
create policy patients_write on patients for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

alter table appointments enable row level security;
create policy appointments_read on appointments for select using (auth.role() = 'authenticated');
create policy appointments_write on appointments for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

alter table visits enable row level security;
create policy visits_read on visits for select using (auth.role() = 'authenticated');
create policy visits_write on visits for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

alter table patient_files enable row level security;
create policy patient_files_read on patient_files for select using (auth.role() = 'authenticated');
create policy patient_files_write on patient_files for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

alter table teeth enable row level security;
create policy teeth_read on teeth for select using (auth.role() = 'authenticated');
create policy teeth_write on teeth for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

alter table dental_records enable row level security;
create policy dental_records_read on dental_records for select using (auth.role() = 'authenticated');
create policy dental_records_write on dental_records for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

alter table invoices enable row level security;
create policy invoices_read on invoices for select using (auth.role() = 'authenticated');
create policy invoices_write on invoices for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

alter table payments enable row level security;
create policy payments_read on payments for select using (auth.role() = 'authenticated');
create policy payments_write on payments for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');

-- Doctor availability: a doctor manages their own schedule (unchanged from
-- the previous schema's behavior).
alter table doctor_working_hours enable row level security;
create policy schedule_read on doctor_working_hours for select using (auth.role() = 'authenticated');
create policy schedule_write on doctor_working_hours for all
  using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
