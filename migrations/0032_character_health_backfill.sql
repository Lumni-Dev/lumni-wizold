-- Backfill health to the Tibia-style ceiling: 150 base plus per-level gain by gender.
-- Lumni (male) +8/level, Luna (female) +6/level. Endurance no longer raises the cap.
update characters
set health = 150 + greatest(0, level - 1) * case gender
  when 'male'::gender then 8
  when 'female'::gender then 6
end;
