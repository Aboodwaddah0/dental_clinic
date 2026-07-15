-- Invoices and payments. paid_amount/status on invoices are denormalized
-- (no more invoice_items/invoice_installments), so a trigger keeps them in
-- sync with the payments table instead of relying on a computed view.

create table invoices (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients (id) on delete cascade,
  total_amount  numeric(10, 2) not null,
  paid_amount   numeric(10, 2) not null default 0,
  status        invoice_status not null default 'unpaid',
  created_at    timestamptz not null default now()
);

create index idx_invoices_patient_id on invoices (patient_id);
create index idx_invoices_status on invoices (status);

create table payments (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices (id) on delete cascade,
  amount          numeric(10, 2) not null,
  payment_method  payment_method not null,
  received_by     uuid references profiles (id),
  payment_date    timestamptz not null default now()
);

create index idx_payments_invoice_id on payments (invoice_id);

-- Recomputes invoices.paid_amount and invoices.status from payments
-- whenever a payment row is inserted, updated, or deleted, so these
-- denormalized columns on invoices can never drift out of sync.
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
      when new_paid_amount <= 0 then 'unpaid'
      when new_paid_amount >= invoice_total then 'paid'
      else 'partially_paid'
    end
  where id = target_invoice_id;

  -- If this was an UPDATE that moved the payment to a different invoice,
  -- also resync the invoice it moved away from.
  if (tg_op = 'UPDATE' and old.invoice_id <> new.invoice_id) then
    select coalesce(sum(amount), 0) into new_paid_amount
    from payments where invoice_id = old.invoice_id;
    select total_amount into invoice_total
    from invoices where id = old.invoice_id;

    update invoices set
      paid_amount = new_paid_amount,
      status = case
        when new_paid_amount <= 0 then 'unpaid'
        when new_paid_amount >= invoice_total then 'paid'
        else 'partially_paid'
      end
    where id = old.invoice_id;
  end if;

  return null; -- AFTER trigger, return value ignored.
end;
$$ language plpgsql;

create trigger trg_sync_invoice_paid_amount
after insert or update or delete on payments
for each row execute function sync_invoice_paid_amount();
