create table if not exists clinic_services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  icon        text default '🦷',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists clinic_portfolio (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Public read, doctor write
alter table clinic_services  enable row level security;
alter table clinic_portfolio enable row level security;

do $$ begin
  create policy services_read  on clinic_services  for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy services_write on clinic_services  for all
    using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy portfolio_read  on clinic_portfolio for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy portfolio_write on clinic_portfolio for all
    using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');
exception when duplicate_object then null; end $$;

-- Default dental services
insert into clinic_services (title, description, icon, sort_order) values
  ('Teeth Cleaning',      'Professional scaling and polishing to keep your teeth healthy.',         '🪥', 1),
  ('Teeth Whitening',     'Brighten your smile with our in-clinic whitening treatment.',            '✨', 2),
  ('Dental Fillings',     'Tooth-coloured fillings to restore decayed or damaged teeth.',           '🔧', 3),
  ('Orthodontics',        'Braces and aligners for a straighter, more confident smile.',            '😁', 4),
  ('Tooth Extraction',    'Safe and comfortable extraction performed by our experienced team.',     '🦷', 5),
  ('Dental Implants',     'Permanent, natural-looking replacements for missing teeth.',             '🏆', 6),
  ('Root Canal Therapy',  'Pain-free treatment to save an infected tooth.',                        '💉', 7),
  ('Dental X-Rays',       'Digital imaging for accurate diagnosis and treatment planning.',         '📷', 8)
on conflict do nothing;
