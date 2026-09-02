alter table users add column tutorial boolean not null default false;
update users set tutorial = true;
