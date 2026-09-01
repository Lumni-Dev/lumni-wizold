alter table users add column two_factor_enabled boolean not null default false;

create table two_factor_codes (
  user_id text primary key references users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0
);

alter table two_factor_codes enable row level security;
