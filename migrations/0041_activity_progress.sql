alter table activities
  add column if not exists beat integer not null default 0,
  add column if not exists enhancement integer,
  add column if not exists resume_enhancement integer,
  add column if not exists cooldown_until timestamptz;
