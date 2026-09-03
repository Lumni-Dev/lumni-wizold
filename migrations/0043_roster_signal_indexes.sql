create table roster_signal (
  id smallint primary key,
  revision bigint not null default 0,
  constraint roster_signal_singleton check (id = 1)
);

insert into roster_signal (id, revision) values (1, 0);

alter table roster_signal enable row level security;

create index tavern_members_last_seen on tavern_members (last_seen);

create index pack_mates_mate_id on pack_mates (mate_id);

create index characters_level_name on characters (level desc, name asc);
