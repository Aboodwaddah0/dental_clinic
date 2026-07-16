-- Add tooth_number (Universal Numbering: 1-32 permanent, 51-70 primary)
-- directly on dental_records so the backend can work without seeding the teeth catalog.
-- tooth_id is left nullable for future FK use.

alter table dental_records
  alter column tooth_id drop not null;

alter table dental_records
  add column tooth_number integer;

create index idx_dental_records_tooth_number on dental_records (tooth_number);
