-- The player's display language, stored so the letters can speak it.
-- Written at the door and refreshed by withGame whenever the client reports
-- a different one; validated in code (en/pt/es), so a new language is a code
-- change, never a schema change.
alter table users add column locale text not null default 'en';
