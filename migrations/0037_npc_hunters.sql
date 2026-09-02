alter table characters add column is_npc boolean not null default false;

create index characters_is_npc on characters (is_npc) where is_npc;
