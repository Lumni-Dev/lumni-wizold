alter table tavern_rooms
  add column number integer,
  add column name_hidden boolean not null default false;

with numbered as (
  select id, row_number() over (order by created_at, id) as n
  from tavern_rooms
)
update tavern_rooms as seated
set number = numbered.n
from numbered
where seated.id = numbered.id;

create sequence tavern_rooms_number_seq;
select setval(
  'tavern_rooms_number_seq',
  coalesce((select max(number) from tavern_rooms), 1),
  exists (select 1 from tavern_rooms)
);

alter table tavern_rooms
  alter column number set default nextval('tavern_rooms_number_seq'),
  alter column number set not null,
  add constraint tavern_rooms_number_positive check (number >= 1);

create unique index tavern_rooms_number on tavern_rooms (number);
