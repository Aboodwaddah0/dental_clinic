-- Extensions (idempotent, likely already present) and the enums/shared
-- trigger function needed by the new schema.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- fuzzy/ILIKE search on patient name & phone

create type appointment_status as enum ('scheduled', 'completed', 'cancelled');
create type file_type as enum ('xray', 'image', 'pdf');
create type dentition_type as enum ('primary', 'permanent');
create type dental_record_status as enum ('active', 'resolved', 'extracted');
create type invoice_status as enum ('unpaid', 'partially_paid', 'paid');
create type payment_method as enum ('cash', 'card', 'transfer');

-- Attach to any table with an `updated_at` column via:
--   create trigger set_updated_at before update on <table>
--   for each row execute function set_updated_at();
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
