create table wallets (
  character_id text primary key references characters (id) on delete cascade,
  cents bigint not null default 1000 check (cents >= 0),
  updated_at timestamptz not null default now()
);

create trigger wallets_updated_at
before update on wallets
for each row execute function set_updated_at();

create table wallet_movements (
  id bigint generated always as identity primary key,
  character_id text not null references characters (id) on delete cascade,
  cents_delta bigint not null,
  reason wallet_reason not null,
  reference_id text,
  created_at timestamptz not null default now()
);

create index wallet_movements_character
  on wallet_movements (character_id, created_at desc);

create table withdrawals (
  id text primary key,
  character_id text not null references characters (id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  pix_key text not null,
  full_name text not null,
  cpf text not null,
  status withdrawal_status not null default 'requested',
  requested_at timestamptz not null default now(),
  settled_at timestamptz
);

create index withdrawals_character on withdrawals (character_id, requested_at desc);

create table store_purchases (
  id text primary key,
  character_id text not null references characters (id) on delete cascade,
  pack_id text not null,
  price_cents integer not null check (price_cents > 0),
  bronze_granted bigint not null check (bronze_granted >= 0),
  purchased_at timestamptz not null default now()
);

create index store_purchases_character
  on store_purchases (character_id, purchased_at desc);

create table bazaar_listings (
  id text primary key,
  seller_id text not null references characters (id) on delete cascade,
  item_id text not null,
  enhancement integer not null default 0 check (enhancement >= 0),
  quantity integer not null check (quantity > 0),
  price_cents integer not null check (price_cents > 0),
  status listing_status not null default 'active',
  announced_at timestamptz not null default now(),
  settled_at timestamptz,
  buyer_name text,
  net_cents integer
);

create index bazaar_listings_board on bazaar_listings (status, announced_at);
create index bazaar_listings_seller on bazaar_listings (seller_id);

create table bazaar_purchases (
  character_id text not null references characters (id) on delete cascade,
  listing_id text not null,
  quantity integer not null check (quantity > 0),
  purchased_at timestamptz not null default now(),
  primary key (character_id, listing_id)
);
