-- Replace the old dental_record_status enum with a flexible varchar column
-- so we can support the full clinical tooth status set.

alter table dental_records
  alter column status drop default;

alter table dental_records
  alter column status type varchar(50) using status::varchar;

alter table dental_records
  alter column status set default 'healthy';

drop type if exists dental_record_status;
