import { withTransaction } from "@/models/repositories/server/database";
import { censorTavernMessage } from "@/models/repositories/server/tavern.store";
import { CHAT_CENSORED_TEXT } from "@/shared/constants/moderation";
import { bumpTavernRevision } from "./tavern-board";
import { publishTavernRevision } from "./tavern-bus";
import { isModerationAllowed } from "./moderation";

export async function reviewChatMessageAfterSend(input: {
  userId: string;
  roomId: string;
  messageId: string;
  text: string;
}): Promise<void> {
  try {
    await withTransaction(async (client) => {
      const allowed = await isModerationAllowed(
        client,
        input.userId,
        input.text,
        "chat_message",
      );
      if (allowed !== false) return;

      const censored = await censorTavernMessage(
        client,
        input.roomId,
        input.messageId,
        CHAT_CENSORED_TEXT,
      );
      if (!censored) return;

      const revision = await bumpTavernRevision(client);
      publishTavernRevision(revision);
    });
  } catch (error) {
    console.error("[tavern/moderation]", error);
  }
}
