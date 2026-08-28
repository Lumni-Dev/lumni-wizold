create table users (
  id text primary key,
  email text unique,
  birth_date date not null,
  created_at timestamptz not null default now()
);
