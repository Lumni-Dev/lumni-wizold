alter table characters add column vip_subscription_id text;
alter table characters add column vip_canceling boolean not null default false;
