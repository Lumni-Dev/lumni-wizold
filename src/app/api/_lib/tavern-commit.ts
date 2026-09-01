import type { PoolClient } from "pg";
import type { TavernState } from "@/models/entities/tavern";
import { saveTavernDiff } from "@/models/repositories/server/tavern.store";
import {
  deletePushSubscriptionByEndpoint,
  listPushSubscriptionsForUsers,
  userIdsForCharacters,
} from "@/models/repositories/server/push.store";
import { publishTavernRevision } from "./tavern-bus";
import { bumpTavernRevision } from "./tavern-board";
import { sendWebPush } from "./web-push";

export interface TavernMessagePush {
  roomId: string;
  roomName: string;
  authorCharacterId: string;
  authorName: string;
  text: string;
  at: string;
}

export async function commitTavernWrite(
  client: PoolClient,
  before: TavernState,
  after: TavernState,
  hashes: Map<string, string>,
  newHashes?: Map<string, string>,
  push?: TavernMessagePush,
): Promise<number> {
  await saveTavernDiff(client, before, after, hashes, newHashes);
  const revision = await bumpTavernRevision(client);
  publishTavernRevision(revision);
  if (push) await notifyTavernMessagePush(client, after, push);
  return revision;
}

async function notifyTavernMessagePush(
  client: PoolClient,
  state: TavernState,
  push: TavernMessagePush,
): Promise<void> {
  const room = state.rooms.find((entry) => entry.id === push.roomId);
  if (!room) return;

  const memberIds = room.members
    .map((member) => member.id)
    .filter((id) => id !== push.authorCharacterId);
  if (memberIds.length === 0) return;

  const owners = await userIdsForCharacters(client, memberIds);
  const userIds = [...new Set([...owners.values()])];
  if (userIds.length === 0) return;

  const subscriptions = await listPushSubscriptionsForUsers(client, userIds);
  if (subscriptions.length === 0) return;

  const payload = {
    title: push.authorName + " · " + push.roomName,
    body: push.text,
    url: "/tavern",
    roomName: push.roomName,
    at: push.at,
  };

  await Promise.all(
    subscriptions.map(async ({ subscription }) => {
      const ok = await sendWebPush(subscription, payload);
      if (!ok) await deletePushSubscriptionByEndpoint(client, subscription.endpoint);
    }),
  );
}
