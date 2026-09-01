-- Revert mistaken health-per-level doubling (0033) and double lineage natural attributes instead.
-- Health back to +8/+6 per level; Lumni/Luna trained naturals gain +9 on each lineage attribute (9 -> 18).

update characters
set health = 150 + greatest(0, level - 1) * case gender
  when 'male'::gender then 8
  when 'female'::gender then 6
end;

update characters
set
  strength = least(1000, strength + 9),
  endurance = least(1000, endurance + 9),
  willpower = least(1000, willpower + 9)
where gender = 'male'::gender;

update characters
set
  agility = least(1000, agility + 9),
  instinct = least(1000, instinct + 9),
  willpower = least(1000, willpower + 9)
where gender = 'female'::gender;
