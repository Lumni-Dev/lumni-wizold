alter table characters add column mining_window_start timestamptz;
alter table characters add column mining_spent_ms bigint not null default 0;
