-- Tooth catalog, visit records, patient files, and per-tooth dental history.

create table teeth (
  id              uuid primary key default gen_random_uuid(),
  fdi_number      varchar(2) not null unique,
  name            varchar(100),
  dentition_type  dentition_type,
  created_at      timestamptz not null default now()
);

create table visits (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references patients (id) on delete cascade,
  doctor_id       uuid not null references profiles (id),
  appointment_id  uuid references appointments (id) on delete set null,
  diagnosis       text,
  treatment       text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index idx_visits_patient_id on visits (patient_id);

create table patient_files (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients (id) on delete cascade,
  file_url      text not null,
  file_type     file_type,
  description   text,
  uploaded_by   uuid references profiles (id),
  created_at    timestamptz not null default now()
);

create index idx_patient_files_patient_id on patient_files (patient_id);

-- Append-only history: nothing here is overwritten, so a full audit trail
-- of every tooth's condition over time is always available.
create table dental_records (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients (id) on delete cascade,
  tooth_id    uuid not null references teeth (id),
  doctor_id   uuid not null references profiles (id),
  condition   varchar(100),
  description text,
  treatment   text,
  status      dental_record_status not null default 'active',
  created_at  timestamptz not null default now()
);

create index idx_dental_records_patient_id on dental_records (patient_id);
