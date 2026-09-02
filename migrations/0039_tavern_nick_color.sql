alter table tavern_members
  add column nick_color smallint;

with ranked as (
  select
    room_id,
    member_id,
    (row_number() over (partition by room_id order by joined_at, member_id) - 1)::smallint as tone
  from tavern_members
)
update tavern_members as seated
set nick_color = ranked.tone
from ranked
where seated.room_id = ranked.room_id
  and seated.member_id = ranked.member_id;

alter table tavern_members
  alter column nick_color set not null,
  add constraint tavern_members_nick_color_range check (nick_color >= 0 and nick_color < 20);
