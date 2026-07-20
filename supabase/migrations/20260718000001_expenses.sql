do $$ begin
  create type expense_category as enum ('supplies', 'salaries', 'rent', 'utilities', 'equipment', 'other');
exception when duplicate_object then null;
end $$;

create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  category      expense_category not null default 'other',
  description   text not null,
  amount        numeric(10, 2) not null check (amount > 0),
  expense_date  date not null default current_date,
  recorded_by   uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists expenses_date_idx on expenses (expense_date);
create index if not exists expenses_category_idx on expenses (category);

do $$ begin
  create trigger set_expenses_updated_at
    before update on expenses
    for each row execute function set_updated_at();
exception when duplicate_object then null;
end $$;

alter table expenses enable row level security;

do $$ begin
  create policy expenses_read on expenses for select using (auth.role() = 'authenticated');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy expenses_write on expenses for all
    using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');
exception when duplicate_object then null;
end $$;
