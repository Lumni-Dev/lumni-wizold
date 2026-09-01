create type presence_status as enum ('active', 'away', 'offline');

alter table characters
  add column presence_status presence_status not null default 'offline',
  add column presence_at timestamptz;
