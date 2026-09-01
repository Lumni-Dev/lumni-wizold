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

const NAME_SYSTEM_PROMPT = `You moderate short public display names in Wizold, a Portuguese werewolf hunting browser game.
Context: hunter names, wolf names, and tavern table names shown in rankings, profiles, and room lists.

Return ONLY valid JSON with a single boolean field "allowed".
- allowed: true → the name may be published
- allowed: false → block the name

Block names that are clearly unfit for a public label:
- profanity, sexual references, or shock-value spelling
- hate slurs targeting protected groups
- impersonation of staff, real brands, or public figures meant to mislead
- credible real-world threats, doxxing attempts, or hard-drug/crime promotion
- primary purpose is harassment or trolling other players

Allow game-appropriate Portuguese names:
- fantasy, hunting, wolf, moon, and tavern themes
- letters and digits, mild edge if still a usable in-game name

Be stricter than tavern chat: a name is always visible and harder to ignore.`;

const CHAT_SYSTEM_PROMPT = `You moderate tavern chat messages in Wizold, a Portuguese werewolf hunting browser game.
Players talk casually about hunts, arena duels, wolves, loot, training, and tavern banter.

Return ONLY valid JSON with a single boolean field "allowed".
- allowed: true → the message may stay published
- allowed: false → censor the message

Default to allowed: true. Block ONLY content that is clearly inappropriate or prohibited in a real multiplayer game.

Block only when obvious:
- explicit sexual content or solicitation
- any sexual content involving minors
- credible real-world threats against a specific person
- hate slurs and dehumanization targeting protected groups
- doxxing: real private contact info, address, documents, or credentials
- promotion or step-by-step instructions for real-world illegal activity
- phishing, scams, or malware links (game URLs and normal conversation are fine)

Allow even if rough or edgy:
- fantasy violence, hunting, duels, defeats, potions, bronze, gear
- mild profanity, frustration, rivalry, trash talk without slurs
- dark humor about in-game danger, emojis, slang, sarcasm, jokes
- strategy, prices, complaints, off-topic banter among adults

When uncertain, allow. Chat is more flexible than names: only remove what is truly out of bounds.`;

function systemPromptFor(context: ModerationContext): string {
  return context === "chat_message" ? CHAT_SYSTEM_PROMPT : NAME_SYSTEM_PROMPT;
}

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
          { role: "system", content: systemPromptFor(context) },
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
