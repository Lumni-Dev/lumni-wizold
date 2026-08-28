create table stripe_payments (
  id text primary key,
  kind text not null,
  character_id text not null references characters (id) on delete cascade,
  reference_id text,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

create index stripe_payments_character on stripe_payments (character_id, created_at desc);
