alter table characters rename column mining_spent_ms to mining_count;
update characters set mining_count = 0, mining_window_start = null;
