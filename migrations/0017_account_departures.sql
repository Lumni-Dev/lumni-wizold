create table account_departures (
  id text primary key,
  email text not null,
  character_name text,
  character_level integer,
  departed_at timestamptz not null default now()
);

create index account_departures_when on account_departures (departed_at desc);

alter table account_departures enable row level security;
