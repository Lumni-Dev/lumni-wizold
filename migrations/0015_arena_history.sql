create table arena_history (
  id text primary key,
  challenger_id text not null references characters (id) on delete cascade,
  challenger_name text not null,
  rival_id text not null references characters (id) on delete cascade,
  rival_name text not null,
  outcome text not null check (outcome in ('victory', 'draw', 'defeat')),
  spoils bigint not null default 0 check (spoils >= 0),
  created_at timestamptz not null default now()
);

create index arena_history_challenger on arena_history (challenger_id, created_at desc);
create index arena_history_rival on arena_history (rival_id, created_at desc);

alter table arena_history enable row level security;
