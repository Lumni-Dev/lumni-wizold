do $$
declare
  tbl record;
begin
  for tbl in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', tbl.tablename);
  end loop;
end
$$;

do $$
declare
  guest text;
begin
  foreach guest in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = guest) then
      execute format('revoke all on all tables in schema public from %I', guest);
      execute format('revoke all on all sequences in schema public from %I', guest);
      execute format('revoke all on all routines in schema public from %I', guest);
      execute format('revoke usage on schema public from %I', guest);
      execute format('alter default privileges in schema public revoke all on tables from %I', guest);
      execute format('alter default privileges in schema public revoke all on sequences from %I', guest);
      execute format('alter default privileges in schema public revoke all on routines from %I', guest);
    end if;
  end loop;
end
$$;
