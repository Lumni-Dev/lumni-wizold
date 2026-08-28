-- The wolf's rest becomes server-clocked: the stamp marks the last collected
-- minute, so a refresh never restarts the recovery the client used to tick.

alter table pets add column rest_collected_at timestamptz;
