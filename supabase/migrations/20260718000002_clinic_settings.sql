create table clinic_settings (
  singleton            int primary key default 1 check (singleton = 1),
  clinic_name          text not null,
  address              text,
  phone                text,
  logo_url             text,
  currency             text not null default '₪',
  locale               text not null default 'en',
  reminders_enabled    boolean not null default false,
  twilio_account_sid   text,
  twilio_auth_token    text,
  twilio_whatsapp_from text,
  twilio_template_sid  text,
  reminder_lead_hours  int not null default 24,
  is_setup_complete    boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger set_clinic_settings_updated_at
  before update on clinic_settings
  for each row execute function set_updated_at();

alter table clinic_settings enable row level security;
create policy clinic_settings_read on clinic_settings for select using (auth.role() = 'authenticated');
create policy clinic_settings_write on clinic_settings for all
  using (current_staff_role() = 'doctor') with check (current_staff_role() = 'doctor');
