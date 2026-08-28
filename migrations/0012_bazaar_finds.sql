create table bazaar_finds (
  character_id text not null references characters (id) on delete cascade,
  item_id text not null,
  primary key (character_id, item_id)
);

alter table bazaar_finds enable row level security;
