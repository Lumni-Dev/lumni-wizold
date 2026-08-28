alter table store_purchases add column status text not null default 'approved';
alter table store_purchases add column settled_at timestamptz;
alter table store_purchases alter column bronze_granted set default 0;

update store_purchases set settled_at = purchased_at where settled_at is null;
