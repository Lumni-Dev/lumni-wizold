create table account_accesses (
  id text primary key,
  email text not null,
  character_name text,
  first_time boolean not null default false,
  ip text,
  accessed_at timestamptz not null default now()
);

create index account_accesses_when on account_accesses (accessed_at desc);

alter table account_accesses enable row level security;
