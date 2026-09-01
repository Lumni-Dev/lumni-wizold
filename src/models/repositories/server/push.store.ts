import type { PoolClient } from "pg";
import { generateId } from "@/shared/utils/id";

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function upsertPushSubscription(
  client: PoolClient,
  userId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
): Promise<void> {
  const id = generateId();
  await client.query(
    `insert into push_subscriptions (id, user_id, endpoint, p256dh, auth)
     values ($1, $2, $3, $4, $5)
     on conflict (user_id, endpoint) do update set p256dh = $4, auth = $5`,
    [id, userId, endpoint, p256dh, auth],
  );
}

export async function deletePushSubscription(
  client: PoolClient,
  userId: string,
  endpoint: string,
): Promise<void> {
  await client.query("delete from push_subscriptions where user_id = $1 and endpoint = $2", [
    userId,
    endpoint,
  ]);
}

export async function listPushSubscriptionsForUsers(
  client: PoolClient,
  userIds: string[],
): Promise<{ userId: string; subscription: PushSubscriptionRow }[]> {
  if (userIds.length === 0) return [];
  const found = await client.query(
    "select user_id, endpoint, p256dh, auth from push_subscriptions where user_id = any($1::text[])",
    [userIds],
  );
  return found.rows.map((row) => ({
    userId: row.user_id,
    subscription: {
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
    },
  }));
}

export async function userIdsForCharacters(
  client: PoolClient,
  characterIds: string[],
): Promise<Map<string, string>> {
  if (characterIds.length === 0) return new Map();
  const found = await client.query(
    "select id, user_id from characters where id = any($1::text[])",
    [characterIds],
  );
  const map = new Map<string, string>();
  for (const row of found.rows) {
    map.set(row.id, row.user_id);
  }
  return map;
}

export async function deletePushSubscriptionByEndpoint(
  client: PoolClient,
  endpoint: string,
): Promise<void> {
  await client.query("delete from push_subscriptions where endpoint = $1", [endpoint]);
}
