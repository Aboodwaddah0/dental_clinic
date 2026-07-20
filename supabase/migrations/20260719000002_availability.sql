create table if not exists doctor_availability (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references profiles(id) on delete cascade,
  day         text not null,
  start_time  text not null default '09:00',
  end_time    text not null default '17:00',
  enabled     boolean not null default false,
  unique(doctor_id, day)
);

create index if not exists doctor_availability_doctor_idx on doctor_availability (doctor_id);

alter table doctor_availability enable row level security;

do $$ begin
  create policy availability_select on doctor_availability
    for select using (auth.uid() = doctor_id or current_staff_role() in ('doctor', 'receptionist', 'admin'));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy availability_upsert on doctor_availability
    for all using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);
exception when duplicate_object then null;
end $$;
