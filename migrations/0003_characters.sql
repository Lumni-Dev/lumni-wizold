create table characters (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  name text not null,
  gender gender not null,
  form character_form not null default 'human',
  level integer not null default 1 check (level between 1 and 1000),
  experience integer not null default 0 check (experience >= 0),
  health integer not null check (health >= 0),
  rage integer not null check (rage >= 0),
  bronze bigint not null default 0 check (bronze >= 0),
  strength integer not null check (strength between 0 and 1000),
  agility integer not null check (agility between 0 and 1000),
  endurance integer not null check (endurance between 0 and 1000),
  instinct integer not null check (instinct between 0 and 1000),
  willpower integer not null check (willpower between 0 and 1000),
  strength_progress integer not null default 0 check (strength_progress >= 0),
  agility_progress integer not null default 0 check (agility_progress >= 0),
  endurance_progress integer not null default 0 check (endurance_progress >= 0),
  instinct_progress integer not null default 0 check (instinct_progress >= 0),
  willpower_progress integer not null default 0 check (willpower_progress >= 0),
  mining_level integer not null default 1 check (mining_level >= 1),
  mining_progress integer not null default 0 check (mining_progress >= 0),
  hunts integer not null default 0 check (hunts >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  arena_wins integer not null default 0 check (arena_wins >= 0),
  arena_losses integer not null default 0 check (arena_losses >= 0),
  created_at timestamptz not null default now(),
  renamed_at timestamptz,
  transformed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index characters_one_per_user on characters (user_id);
create index characters_name on characters (lower(name));

create trigger characters_updated_at
before update on characters
for each row execute function set_updated_at();

create table pets (
  id text primary key,
  character_id text not null unique references characters (id) on delete cascade,
  name text not null,
  gender gender not null,
  energy integer not null default 0 check (energy >= 0),
  active boolean not null default true,
  level integer not null default 1 check (level between 1 and 100),
  training_progress integer not null default 0 check (training_progress >= 0),
  adopted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pets_updated_at
before update on pets
for each row execute function set_updated_at();

create table equipped_items (
  character_id text not null references characters (id) on delete cascade,
  slot equipment_slot not null,
  item_id text not null,
  primary key (character_id, slot)
);

create table inventory_items (
  character_id text not null references characters (id) on delete cascade,
  item_id text not null,
  quantity integer not null check (quantity > 0),
  primary key (character_id, item_id)
);

create table enhancements (
  character_id text not null references characters (id) on delete cascade,
  item_id text not null,
  level integer not null check (level between 1 and 1000),
  primary key (character_id, item_id)
);
