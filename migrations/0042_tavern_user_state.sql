create table tavern_read_cursors (
  character_id text not null references characters (id) on delete cascade,
  room_id text not null references tavern_rooms (id) on delete cascade,
  last_read_at timestamptz not null,
  primary key (character_id, room_id)
);

create index tavern_read_cursors_character on tavern_read_cursors (character_id);

create table tavern_ui_state (
  character_id text primary key references characters (id) on delete cascade,
  open_room_id text references tavern_rooms (id) on delete set null,
  window_open boolean not null default false,
  window_x double precision not null default 0,
  window_y double precision not null default 0
);

alter table tavern_read_cursors enable row level security;
alter table tavern_ui_state enable row level security;
