create table deletion_codes (
  user_id text primary key references users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0
);

alter table deletion_codes enable row level security;
