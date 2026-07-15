-- Staff profiles (layered on Supabase Auth) and core patient records.

create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   varchar(100) not null,
  email       varchar(150),
  phone       varchar(20),
  role        staff_role not null,
  specialty   varchar(100),
  created_at  timestamptz not null default now()
);

create index idx_profiles_role on profiles (role);

-- Helper used repeatedly by RLS policies (see 20260712000023_rls_policies.sql).
create or replace function current_staff_role()
returns staff_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create table patients (
  id              uuid primary key default gen_random_uuid(),
  full_name       varchar(100) not null,
  phone           varchar(20) not null,
  date_of_birth   date,
  gender          varchar(20) check (gender in ('male', 'female', 'other')),
  address         text,
  blood_type      varchar(10),
  allergies       text,
  medical_notes   text,
  registered_by   uuid references profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger set_updated_at before update on patients
for each row execute function set_updated_at();

-- Fuzzy/partial search support for "search patients by name or phone".
create index idx_patients_full_name_trgm on patients using gin (full_name gin_trgm_ops);
create index idx_patients_phone_trgm on patients using gin (phone gin_trgm_ops);
