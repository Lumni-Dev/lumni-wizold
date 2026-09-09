-- The switchboard keeps one column per switch, so a new automation needs a
-- column of its own or it is dropped on save and reads false on the next
-- load. Two were missing: the arena, which has been kept only in memory since
-- it shipped, and the cauldron.
alter table automation_settings
  add column if not exists arena boolean not null default false,
  add column if not exists alchemy boolean not null default false;
