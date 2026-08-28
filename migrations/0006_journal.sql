create table log_entries (
  id text primary key,
  character_id text not null references characters (id) on delete cascade,
  kind log_kind not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index log_entries_character on log_entries (character_id, created_at desc);

create table activities (
  character_id text primary key references characters (id) on delete cascade,
  kind activity_kind not null,
  target_id text,
  paused boolean not null default false,
  resume_kind activity_kind,
  resume_target_id text,
  started_at timestamptz not null default now()
);

create table automation_settings (
  character_id text primary key references characters (id) on delete cascade,
  hunt boolean not null default false,
  train boolean not null default false,
  mine boolean not null default false,
  forge boolean not null default false,
  rest boolean not null default false,
  transform boolean not null default false,
  potion boolean not null default false,
  pet_feed boolean not null default false,
  pet_rest boolean not null default false
);
