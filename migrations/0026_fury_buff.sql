-- Transformation is gone and the rage/fury vital retired. The fury potion is now a
-- timed buff (+10 to every attribute); fury_until is the moment that buff ends.
-- The old form, rage and transformed_at columns stay as vestigial columns (the
-- store keeps writing their defaults), so this migration never drops live player
-- data and no deploy window sees a schema the running build cannot read.
alter table characters add column if not exists fury_until timestamptz;
alter table characters alter column form set default 'human';
alter table characters alter column rage set default 0;
