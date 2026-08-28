create table arena_duels (
  character_id text not null references characters (id) on delete cascade,
  opponent_id text not null,
  dueled_at timestamptz not null,
  primary key (character_id, opponent_id)
);

create table pack_mates (
  character_id text not null references characters (id) on delete cascade,
  mate_id text not null,
  mate_name text not null,
  added_at timestamptz not null default now(),
  primary key (character_id, mate_id)
);

create table tavern_rooms (
  id text primary key,
  name text not null,
  password_hash text,
  owner_id text not null references characters (id) on delete cascade,
  private_for text[],
  created_at timestamptz not null default now()
);

create unique index tavern_rooms_one_per_owner
  on tavern_rooms (owner_id) where private_for is null;
create unique index tavern_rooms_open_name
  on tavern_rooms (lower(name)) where private_for is null;

create table tavern_members (
  room_id text not null references tavern_rooms (id) on delete cascade,
  member_id text not null references characters (id) on delete cascade,
  member_name text not null,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (room_id, member_id)
);

create table tavern_messages (
  id text primary key,
  room_id text not null references tavern_rooms (id) on delete cascade,
  author_id text not null,
  author_name text not null,
  body text not null check (char_length(body) <= 240),
  sent_at timestamptz not null default now()
);

create index tavern_messages_room on tavern_messages (room_id, sent_at desc);
