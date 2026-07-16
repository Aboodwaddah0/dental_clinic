create or replace function get_patient_balances(patient_ids uuid[])
returns table(patient_id uuid, remaining numeric) as $$
  select
    patient_id,
    coalesce(sum(total_amount - paid_amount), 0) as remaining
  from invoices
  where patient_id = any(patient_ids)
  group by patient_id;
$$ language sql stable security definer;
