-- Fix: the CASE expression in sync_invoice_paid_amount() evaluated to text,
-- which Postgres won't implicitly cast to the invoice_status enum on
-- assignment ("column status is of type invoice_status but expression is
-- of type text"). Cast each branch explicitly.

create or replace function sync_invoice_paid_amount()
returns trigger as $$
declare
  target_invoice_id uuid;
  new_paid_amount    numeric(10, 2);
  invoice_total      numeric(10, 2);
begin
  if (tg_op = 'DELETE') then
    target_invoice_id := old.invoice_id;
  else
    target_invoice_id := new.invoice_id;
  end if;

  select coalesce(sum(amount), 0) into new_paid_amount
  from payments where invoice_id = target_invoice_id;
  select total_amount into invoice_total
  from invoices where id = target_invoice_id;

  update invoices set
    paid_amount = new_paid_amount,
    status = case
      when new_paid_amount <= 0 then 'unpaid'::invoice_status
      when new_paid_amount >= invoice_total then 'paid'::invoice_status
      else 'partially_paid'::invoice_status
    end
  where id = target_invoice_id;

  if (tg_op = 'UPDATE' and old.invoice_id <> new.invoice_id) then
    select coalesce(sum(amount), 0) into new_paid_amount
    from payments where invoice_id = old.invoice_id;
    select total_amount into invoice_total
    from invoices where id = old.invoice_id;

    update invoices set
      paid_amount = new_paid_amount,
      status = case
        when new_paid_amount <= 0 then 'unpaid'::invoice_status
        when new_paid_amount >= invoice_total then 'paid'::invoice_status
        else 'partially_paid'::invoice_status
      end
    where id = old.invoice_id;
  end if;

  return null; -- AFTER trigger, return value ignored.
end;
$$ language plpgsql;
