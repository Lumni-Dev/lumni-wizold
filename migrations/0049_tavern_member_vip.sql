alter table tavern_members
  add column if not exists vip boolean not null default false;
