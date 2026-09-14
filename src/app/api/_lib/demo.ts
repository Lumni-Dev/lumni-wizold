import type { PoolClient } from "pg";
import { failure, type Result } from "@/models/entities/result";
import type { GameState } from "@/models/entities/game-state";
import { DEMO_LIMIT, DEMO_LIMIT_MESSAGE, type DemoAction } from "@/shared/constants/demo";

export interface DemoBlock {
  demoLimit: DemoAction;
  limit: number;
}

export function demoMode(): boolean {
  return (process.env.GAME_MODE ?? "").trim().toLowerCase() === "demo";
}

async function demoUsed(client: PoolClient, userId: string, action: DemoAction): Promise<number> {
  const found = await client.query(
    "select used from demo_quota where user_id = $1 and action = $2",
    [userId, action],
  );
  return Number(found.rows[0]?.used ?? 0);
}

// Refuses the action once the account has spent its demo allowance. Returns
// null (let it through) whenever demo mode is off.
export async function demoGate(
  client: PoolClient,
  userId: string,
  state: GameState,
  action: DemoAction,
): Promise<Result<never> | null> {
  if (!demoMode()) return null;
  if ((await demoUsed(client, userId, action)) < DEMO_LIMIT) return null;
  const block: DemoBlock = { demoLimit: action, limit: DEMO_LIMIT };
  // Result<never> so the route keeps its own success type; data still carries the block.
  return failure(state, DEMO_LIMIT_MESSAGE, block) as Result<never>;
}

// Counts one completed action against the account. No-op when demo mode is off.
export async function spendDemo(client: PoolClient, userId: string, action: DemoAction): Promise<void> {
  if (!demoMode()) return;
  await client.query(
    `insert into demo_quota (user_id, action, used)
     values ($1, $2, 1)
     on conflict (user_id, action) do update set used = demo_quota.used + 1`,
    [userId, action],
  );
}
