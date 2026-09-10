-- The fury potion now lights a beast as deep as its flask: small, medium and
-- large lend a different bonus, so the character has to remember which glass
-- is running. Nullable on purpose: a row with fury already on and no size
-- recorded reads back as the moon bonus, the flat value it was drunk under.
alter table characters
  add column if not exists fury_bonus integer check (fury_bonus >= 0);
