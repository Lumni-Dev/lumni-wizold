import type { PoolClient } from "pg";
import type { TavernState } from "@/models/entities/tavern";
import { withTransaction } from "@/models/repositories/server/database";
import { loadRoomState, saveTavernDiff } from "@/models/repositories/server/tavern.store";
import {
  deletePushSubscriptionByEndpoint,
  listPushSubscriptionsForUsers,
  userIdsForCharacters,
} from "@/models/repositories/server/push.store";
import { userLocales } from "@/models/repositories/server/user.store";
import { translate } from "@/shared/i18n/dictionary";
import { TAVERN_NOTICE_BODY } from "@/shared/constants/moderation";
import { publishTavernRevision } from "./tavern-bus";
import { bumpTavernRevision } from "./tavern-board";
import { sendWebPush } from "./web-push";

export interface TavernMessagePush {
  roomId: string;
  roomName: string;
  authorCharacterId: string;
  authorName: string;
  at: string;
}

export async function commitTavernWrite(
  client: PoolClient,
  before: TavernState,
  after: TavernState,
  hashes: Map<string, string>,
  newHashes?: Map<string, string>,
): Promise<number> {
  await saveTavernDiff(client, before, after, hashes, newHashes);
  const revision = await bumpTavernRevision(client);
  publishTavernRevision(revision);
  return revision;
}

export async function deliverTavernMessagePush(push: TavernMessagePush): Promise<void> {
  await withTransaction(async (client) => {
    const loaded = await loadRoomState(client, push.roomId, false);
    await notifyTavernMessagePush(client, loaded.state, push);
  });
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

  // The notice speaks each receiver's stored language: the payload carries the
  // localized body and the reply label, so the service worker stays dumb.
  const locales = await userLocales(client, [...new Set(subscriptions.map((row) => row.userId))]);

  // The sends fan out over the network, but the stale deletions wait their
  // turn: pg runs one query per client, so two failures deleting in parallel
  // on the shared client would trip the concurrent-query deprecation.
  const stale: string[] = [];
  await Promise.all(
    subscriptions.map(async ({ userId, subscription }) => {
      const locale = locales.get(userId) ?? "en";
      const payload = {
        title: push.authorName + " · " + push.roomName,
        body: translate(TAVERN_NOTICE_BODY, locale),
        reply: translate("Reply", locale),
        url: "/tavern",
        roomName: push.roomName,
        at: push.at,
      };
      const ok = await sendWebPush(subscription, payload);
      if (!ok) stale.push(subscription.endpoint);
    }),
  );
  for (const endpoint of stale) {
    await deletePushSubscriptionByEndpoint(client, endpoint);
  }
}
