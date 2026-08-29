alter table characters drop constraint characters_level_check;
alter table characters add constraint characters_level_check check (level >= 1);

alter table pets drop constraint pets_level_check;
alter table pets add constraint pets_level_check check (level >= 1);

alter table enhancements drop constraint enhancements_level_check;
alter table enhancements add constraint enhancements_level_check check (level >= 1);
