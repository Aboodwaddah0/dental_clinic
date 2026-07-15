-- Appointments and doctor weekly availability.

create table appointments (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references patients (id) on delete cascade,
  doctor_id         uuid not null references profiles (id),
  appointment_date  date not null,
  start_time        time not null,
  end_time          time not null,
  status            appointment_status not null default 'scheduled',
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (end_time > start_time)
);

create trigger set_updated_at before update on appointments
for each row execute function set_updated_at();

create index idx_appointments_doctor_date on appointments (doctor_id, appointment_date);
create index idx_appointments_patient_id on appointments (patient_id);
create index idx_appointments_status on appointments (status);

create table doctor_working_hours (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time)
);

create index idx_doctor_working_hours_doctor_id on doctor_working_hours (doctor_id);
