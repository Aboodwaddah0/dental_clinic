-- Drop doctor_working_hours entirely: no working-hours/availability concept
-- in this system. CASCADE removes its RLS policies and index automatically.
-- Nothing else references this table, so this is a clean, isolated drop.

drop table if exists doctor_working_hours cascade;
