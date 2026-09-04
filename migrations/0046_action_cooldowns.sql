create table action_cooldowns (
  character_id text not null references characters(id) on delete cascade,
  action text not null,
  ready_at timestamptz not null,
  primary key (character_id, action)
);

alter table action_cooldowns enable row level security;
