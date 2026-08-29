create table rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

create index rate_limits_window on rate_limits (window_start);

alter table rate_limits enable row level security;
