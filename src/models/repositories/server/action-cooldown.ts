import type { PoolClient } from "pg";

export async function cooldownLeft(
  client: PoolClient,
  characterId: string,
  action: string,
): Promise<number> {
  const found = await client.query(
    `select ceil(extract(epoch from (ready_at - now())) * 1000) as left
       from action_cooldowns
      where character_id = $1 and action = $2`,
    [characterId, action],
  );
  const left = Number(found.rows[0]?.left ?? 0);
  return left > 0 ? left : 0;
}

export async function setCooldown(
  client: PoolClient,
  characterId: string,
  action: string,
  ms: number,
): Promise<void> {
  await client.query(
    `insert into action_cooldowns (character_id, action, ready_at)
     values ($1, $2, now() + make_interval(secs => $3))
     on conflict (character_id, action) do update set ready_at = excluded.ready_at`,
    [characterId, action, Math.max(0, ms) / 1000],
  );
}
