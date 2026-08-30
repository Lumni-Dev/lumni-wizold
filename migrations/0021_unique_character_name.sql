-- One hunter, one name. Case-insensitive so "Lumni" and "LUMNI" cannot coexist.
-- Requires a roster with no duplicate names already (a fresh or reset world).
create unique index characters_name_unique on characters (lower(name));
