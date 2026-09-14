-- Demo mode (GAME_MODE=demo): how many times each account has already
-- forged, hunted, trained and fought. Rows are only written while demo
-- mode is on; to undo the feature, drop this table.
create table demo_quota (
  user_id text not null references users(id) on delete cascade,
  action text not null,
  used integer not null default 0,
  primary key (user_id, action)
);

alter table demo_quota enable row level security;
