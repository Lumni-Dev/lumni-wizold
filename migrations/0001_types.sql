create type gender as enum ('male', 'female');

create type character_form as enum ('human', 'werewolf');

create type equipment_slot as enum (
  'helmet', 'necklace', 'armor', 'pants', 'boots', 'claw', 'ring'
);

create type log_kind as enum (
  'system', 'character', 'training', 'hunt', 'arena', 'market', 'inventory'
);

create type activity_kind as enum ('hunt', 'train', 'mine', 'forge', 'rest');

create type listing_status as enum ('active', 'sold', 'cancelled');

create type withdrawal_status as enum ('requested', 'paid', 'rejected');

create type wallet_reason as enum (
  'starting_balance', 'bazaar_sale', 'withdrawal', 'adjustment'
);

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
