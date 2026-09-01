-- Double per-level health gain: Lumni +16/level, Luna +12/level (was +8/+6).
update characters
set health = 150 + greatest(0, level - 1) * case gender
  when 'male'::gender then 16
  when 'female'::gender then 12
end;
