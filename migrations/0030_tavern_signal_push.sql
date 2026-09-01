create table tavern_signal (
  id int primary key default 1,
  revision bigint not null default 0,
  constraint tavern_signal_singleton check (id = 1)
);

insert into tavern_signal (id, revision) values (1, 0);

create table push_subscriptions (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create unique index push_subscriptions_user_endpoint on push_subscriptions (user_id, endpoint);
create index push_subscriptions_user_id on push_subscriptions (user_id);

alter table tavern_signal enable row level security;
alter table push_subscriptions enable row level security;
