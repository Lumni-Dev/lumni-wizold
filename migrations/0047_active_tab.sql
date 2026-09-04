alter table users
  add column if not exists active_tab text,
  add column if not exists active_tab_at timestamptz;
