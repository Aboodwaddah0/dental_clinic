-- Add before/after image columns and template type to clinic_portfolio
alter table clinic_portfolio
  add column if not exists before_image_url text,
  add column if not exists after_image_url  text,
  add column if not exists template         text not null default 'single';

-- Create storage bucket for portfolio images (public)
insert into storage.buckets (id, name, public)
  values ('portfolio-images', 'portfolio-images', true)
  on conflict (id) do nothing;

-- Allow public read
do $$ begin
  create policy "portfolio_images_read" on storage.objects
    for select using (bucket_id = 'portfolio-images');
exception when duplicate_object then null; end $$;

-- Allow doctor upload/delete
do $$ begin
  create policy "portfolio_images_write" on storage.objects
    for insert with check (
      bucket_id = 'portfolio-images'
      and current_staff_role() = 'doctor'
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "portfolio_images_delete" on storage.objects
    for delete using (
      bucket_id = 'portfolio-images'
      and current_staff_role() = 'doctor'
    );
exception when duplicate_object then null; end $$;
