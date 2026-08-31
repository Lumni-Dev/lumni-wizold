alter table inventory_items add column enhancement integer not null default 0;

update inventory_items i set enhancement = e.level
from enhancements e
where e.character_id = i.character_id and e.item_id = i.item_id;

alter table inventory_items drop constraint inventory_items_pkey;
alter table inventory_items add primary key (character_id, item_id, enhancement);

alter table equipped_items add column enhancement integer not null default 0;

update equipped_items eq set enhancement = e.level
from enhancements e
where e.character_id = eq.character_id and e.item_id = eq.item_id;

drop table enhancements;
