insert into inventory_items (character_id, item_id, quantity, enhancement)
select id, 'rage-potion-small', 10, 0
from characters
on conflict (character_id, item_id, enhancement)
do update set quantity = inventory_items.quantity + 10;
