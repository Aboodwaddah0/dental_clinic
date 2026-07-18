alter table appointments
  add column if not exists reminder_status text not null default 'pending',
  add column if not exists reminded_at    timestamptz,
  add column if not exists reminder_error text;

create index if not exists appointments_reminder_idx
  on appointments (reminder_status, appointment_date);
