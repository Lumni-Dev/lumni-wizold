-- Accounts. The login flow collects the birth date before anything else:
-- the game is 18+ (blood, PvP, open chat, real-money Pix both ways).

create table users (
  id text primary key,
  email text unique,
  birth_date date not null,
  created_at timestamptz not null default now()
);
