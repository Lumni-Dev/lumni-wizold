-- The cauldron climbs a ladder of its own, like the mine: what a scroll asks
-- is alchemy skill, not the hunter's level.
alter table characters
  add column if not exists alchemy_level integer not null default 1 check (alchemy_level >= 1),
  add column if not exists alchemy_progress integer not null default 0 check (alchemy_progress >= 0);
