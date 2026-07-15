-- Full schema reset: the clinic's data model is being replaced with a much
-- simpler 10-table design (see docs/backend-roadmap.md). Drop everything
-- from the old schema; the new schema is created in the migrations that
-- follow. Order: views -> dependent/leaf tables -> base tables -> enums
-- (enums can't drop while a column still uses them). CASCADE on each table
-- also removes its FKs, indexes, RLS policies, and any referencing view.

drop view if exists v_new_patients_by_month cascade;
drop view if exists v_monthly_revenue cascade;
drop view if exists v_treatment_popularity cascade;
drop view if exists v_doctor_performance cascade;
drop view if exists v_appointment_stats cascade;
drop view if exists v_tooth_current_status cascade;
drop view if exists v_inventory_stock_levels cascade;
drop view if exists v_inventory_expiring_batches cascade;
drop view if exists v_invoice_balances cascade;

drop table if exists inventory_transactions cascade;
drop table if exists inventory_batches cascade;
drop table if exists inventory_items cascade;

drop table if exists payments cascade;
drop table if exists invoice_installments cascade;
drop table if exists invoice_items cascade;
drop table if exists invoices cascade;

drop table if exists appointment_reminders cascade;
drop table if exists appointments cascade;
drop table if exists doctor_time_off cascade;
drop table if exists doctor_working_hours cascade;

drop table if exists treatment_sessions cascade;
drop table if exists treatment_plan_items cascade;
drop table if exists treatment_plans cascade;
drop table if exists treatment_types cascade;
drop table if exists tooth_conditions cascade;
drop table if exists clinical_notes cascade;
drop table if exists patient_files cascade;
drop table if exists tooth_condition_types cascade;
drop table if exists fdi_teeth cascade;

drop table if exists patient_chronic_conditions cascade;
drop table if exists chronic_conditions cascade;
drop table if exists patient_allergies cascade;
drop table if exists allergies cascade;

drop table if exists patients cascade;
drop table if exists profiles cascade;

drop function if exists current_staff_role() cascade;
drop function if exists set_updated_at() cascade;

-- invoice_status and payment_method are reused as names in the new schema
-- but with different value sets, so drop-then-recreate is correct here.
drop type if exists reminder_status;
drop type if exists reminder_channel;
drop type if exists invoice_status;
drop type if exists payment_method;
drop type if exists treatment_status;
drop type if exists appointment_status;
-- staff_role is KEPT (still just 'doctor') -- do not drop.
