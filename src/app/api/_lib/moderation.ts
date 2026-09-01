import type { PoolClient } from "pg";
import {
  MODERATION_REFUSAL,
  MODERATION_UNAVAILABLE,
} from "@/shared/constants/moderation";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 8000;

export type ModerationContext = "hunter_name" | "wolf_name" | "room_name" | "chat_message";

const CONTEXT_HINT: Record<ModerationContext, string> = {
  hunter_name: "player character display name (hunter)",
  wolf_name: "pet wolf display name",
  room_name: "tavern chat table name visible to other players",
  chat_message: "tavern chat message visible to other players",
};

const SYSTEM_PROMPT = `You moderate user text in Wizold, a Portuguese werewolf hunting browser game.
Fantasy game context is normal: hunting creatures, arena duels, wolves, moons, potions, bronze loot, tavern banter.

Return ONLY valid JSON with a single boolean field "allowed".
- allowed: true → text may be published in the game
- allowed: false → block the text

Block clearly harmful real-world content:
- sexual violence or explicit sexual content
- promotion or instructions for real-world crime
- drug trafficking or hard-drug promotion (fantasy potions and game items are fine)
- credible threats of harm against real people
- hate slurs targeting protected groups
- doxxing or sharing personal data

Allow game-appropriate Portuguese text:
- fantasy names and nicknames, mild in-game trash talk, hunting/wolf themes, fictional violence, emojis in chat.`;

function buildUserPrompt(text: string, context: ModerationContext): string {
  return (
    "Context: " +
    CONTEXT_HINT[context] +
    "\nLanguage: Portuguese (pt-BR)\nText:\n" +
    text
  );
}

function parseAllowed(content: string): boolean | null {
  try {
    const parsed = JSON.parse(content) as { allowed?: unknown };
    if (typeof parsed.allowed === "boolean") return parsed.allowed;
    return null;
  } catch {
    return null;
  }
}

async function isTestAccount(client: PoolClient, userId: string): Promise<boolean> {
  const found = await client.query<{ email: string }>("select email from users where id = $1", [
    userId,
  ]);
  const email = found.rows[0]?.email;
  return typeof email === "string" && email.endsWith("@wizold.test");
}

export async function isModerationAllowed(
  client: PoolClient,
  userId: string,
  text: string,
  context: ModerationContext,
): Promise<boolean | null> {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (await isTestAccount(client, userId)) return true;

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  return callModeration(trimmed, context);
}

async function callModeration(text: string, context: ModerationContext): Promise<boolean | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        authorization: "Bearer " + key,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(text, context) },
        ],
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[moderation] OpenAI respondeu", response.status);
      return null;
    }

    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      console.error("[moderation] resposta sem conteúdo");
      return null;
    }

    return parseAllowed(content);
  } catch (error) {
    console.error("[moderation]", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Returns a player-facing refusal message, or null when the text may proceed. */
export async function moderationRefusal(
  client: PoolClient,
  userId: string,
  text: string,
  context: ModerationContext,
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (await isTestAccount(client, userId)) return null;

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    if (process.env.NODE_ENV === "production") return MODERATION_UNAVAILABLE;
    console.warn("[moderation] OPENAI_API_KEY ausente; texto liberado.");
    return null;
  }

  const allowed = await callModeration(trimmed, context);
  if (allowed === true) return null;
  if (allowed === false) return MODERATION_REFUSAL;
  return process.env.NODE_ENV === "production" ? MODERATION_UNAVAILABLE : null;
}
