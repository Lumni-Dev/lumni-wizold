import { createHmac, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const EMAIL = "smoke@wizold.test";
let cookie = "";
let failures = 0;
function check(name, condition, detail = "") {
  const mark = condition ? "✔" : "✘";
  if (!condition) failures += 1;
  console.log(mark + " " + name + (detail ? "  :: " + detail : ""));
}
async function call(method, path, body) {
  const response = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const jar = response.headers.getSetCookie?.() ?? [];
  for (const line of jar) {
    if (line.startsWith("wizold_session=")) cookie = line.split(";")[0];
  }
  let payload = null;
  try {
    payload = await response.json();
  } catch {}
  return { status: response.status, payload };
}
for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
const require = createRequire(import.meta.url);
const pg = require(process.cwd() + "/node_modules/pg");
const client = new pg.Client({
  database: "postgres",
  ssl: { ca: readFileSync(join(ROOT, "certs/supabase-ca.crt"), "utf8"), rejectUnauthorized: true },
});
await client.connect();
const rows = async (sql, params) => (await client.query(sql, params)).rows;
await client.query("delete from users where email in ($1, $2, $3)", [
  EMAIL,
  "rival@wizold.test",
  "packmate@wizold.test",
]);
const anonymous = await call("POST", "/api/state");
check("no session is 401", anonymous.status === 401);
const warm = await call("GET", "/api/cron/warm");
check(
  "warmer answers or stays behind the shield",
  (warm.status === 200 && warm.payload?.ok === true) || warm.status === 403,
  String(warm.status),
);
const minor = await call("POST", "/api/auth/enter", {
  credential: "qualquer.coisa.aqui",
  birth: { day: "01", month: "01", year: "2012" },
});
check("under 18 is 403", minor.status === 403, minor.payload?.message);
const forged = await call("POST", "/api/auth/enter", {
  credential: "cabeca.corpo.assinatura-forjada",
  birth: { day: "01", month: "01", year: "1990" },
});
check("forged credential is 401", forged.status === 401, forged.payload?.message);
const secret = process.env.SESSION_SECRET ?? "";
check("session secret at hand", secret.length >= 32);
const userId = "usr_" + Date.now().toString(36) + "_smk" + randomBytes(2).toString("hex");
await client.query("insert into users (id, email, birth_date) values ($1, $2, $3)", [
  userId,
  EMAIL,
  "1990-01-01",
]);
const payload = userId + "." + (Date.now() + 3600000);
cookie =
  "wizold_session=" +
  payload +
  "." +
  createHmac("sha256", secret).update(payload).digest("base64url");
const me = await call("GET", "/api/auth/me");
check("signed session opens the door", me.payload?.data?.userId === userId);
check("still no character", me.payload?.data?.hasCharacter === false);
const badName = await call("POST", "/api/characters", { name: "dois nomes", gender: "female" });
check("name with space refuses", badName.payload?.ok === false);
const created = await call("POST", "/api/characters", { name: "Fumaca", gender: "female" });
check("character created", created.payload?.ok === true, created.payload?.message);
const rivalId = "usr_" + Date.now().toString(36) + "_riv" + randomBytes(2).toString("hex");
await client.query("insert into users (id, email, birth_date) values ($1, $2, $3)", [
  rivalId,
  "rival@wizold.test",
  "1990-01-01",
]);
const mine = cookie;
const rivalPayload = rivalId + "." + (Date.now() + 3600000);
cookie =
  "wizold_session=" +
  rivalPayload +
  "." +
  createHmac("sha256", secret).update(rivalPayload).digest("base64url");
const clash = await call("POST", "/api/characters", { name: "Fumaca", gender: "male" });
check("repeated name refuses", clash.payload?.ok === false, clash.payload?.message);
const clashUpper = await call("POST", "/api/characters", { name: "FUMACA", gender: "male" });
check("repeated name ignores case", clashUpper.payload?.ok === false, clashUpper.payload?.message);
await client.query("delete from users where id = $1", [rivalId]);
cookie = mine;
const state1Answer = await call("POST", "/api/state");
const state1 = state1Answer.payload?.data;
check("born with 200 bronze", state1?.character?.bronze === 200);
check("tutorial starts open", state1Answer.payload?.tutorial === false);
const meTutorial = await call("GET", "/api/auth/me");
check("me carries the open tutorial", meTutorial.payload?.data?.tutorial === false);
const started = await call("POST", "/api/tutorial");
check(
  "starting the game marks the tutorial",
  started.payload?.ok === true && started.payload?.tutorial === true,
);
const meDone = await call("GET", "/api/auth/me");
check("tutorial stays marked", meDone.payload?.data?.tutorial === true);
const startedAgain = await call("POST", "/api/tutorial");
check("marking again does not reopen", startedAgain.payload?.tutorial === true);
check("wallet is born with R$ 10", state1?.wallet?.cents === 1000);
check("ten potions in the bag", state1?.inventory?.[0]?.quantity === 10);
const stockFury = await call("POST", "/api/market/buy", {
  itemId: "rage-potion-small",
  quantity: 2,
});
check("without funds the shop refuses", stockFury.payload?.ok === false, stockFury.payload?.message);
const raged = await call("POST", "/api/inventory/consume", { itemId: "rage-potion-small" });
check("fury potion lights the beast", raged.payload?.ok === true, raged.payload?.message);
const afterFury = (await call("POST", "/api/state")).payload?.data;
check("fury stays stamped on the character", typeof afterFury?.character?.furyUntil === "string");
const ragedAgain = await call("POST", "/api/inventory/consume", { itemId: "rage-potion-small" });
check(
  "drinking again restarts the clock",
  ragedAgain.payload?.ok === true,
  ragedAgain.payload?.message,
);
const afterRecast = (await call("POST", "/api/state")).payload?.data;
check(
  "the new deadline never falls behind the old one",
  typeof afterRecast?.character?.furyUntil === "string" &&
    Date.parse(afterRecast.character.furyUntil) >= Date.parse(afterFury.character.furyUntil),
);
const staleCollect = await call("PATCH", "/api/character/rest");
check(
  "activity drops the rest on the server",
  staleCollect.payload?.ok === false,
  staleCollect.payload?.message,
);
const hunt = await call("POST", "/api/hunt", { territoryId: "village-field" });
const report = hunt.payload?.data;
check(
  "hunt resolves and lands atomically",
  hunt.payload?.ok === true && Array.isArray(report?.combat?.rounds),
);
const state2 = (await call("POST", "/api/state")).payload?.data;
check("hunt counted on the server", state2?.character?.hunts === 1);
const huntTooSoon = await call("POST", "/api/hunt", { territoryId: "village-field" });
check("server cooldown blocks the immediate hunt", huntTooSoon.payload?.ok === false);
const stateAfterBlocked = (await call("POST", "/api/state")).payload?.data;
check("blocked hunt does not count on the server", stateAfterBlocked?.character?.hunts === 1);
const bought = await call("POST", "/api/market/buy", {
  itemId: "health-potion-small",
  quantity: 1,
});
check("market purchase", bought.payload?.ok === true, bought.payload?.message);
const state3 = (await call("POST", "/api/state")).payload?.data;
check(
  "bronze desceu na compra",
  typeof state3?.character?.bronze === "number" &&
    state3.character.bronze < state2?.character?.bronze,
);
const trained = await call("POST", "/api/training/session", { exerciseId: "ice-bath" });
check("training session", trained.payload?.ok === true, trained.payload?.message);
check(
  "arena nasce sem duelo gasto",
  state3?.arenaDuels !== null &&
    typeof state3?.arenaDuels === "object" &&
    Object.keys(state3.arenaDuels).length === 0,
);
const openTry = await call("POST", "/api/tavern/rooms", { name: "Praca", password: "" });
check("table without password demands the minimum LV", openTry.payload?.ok === false, openTry.payload?.message);
const room = await call("POST", "/api/tavern/rooms", { name: "Fogueira", password: "segredo" });
check("table with password opens at any level", room.payload?.ok === true, room.payload?.message);
const roomId = room.payload?.data?.roomId;
const spoke = await call("POST", "/api/tavern/rooms/" + roomId + "/messages", {
  text: "Uivo de teste",
});
check("line recorded", spoke.payload?.ok === true);
const linked = await call("POST", "/api/tavern/rooms/" + roomId + "/messages", {
  text: "vem ver https://exemplo.com",
});
check("link at the table is refused", linked.payload?.ok === false, linked.payload?.message);
const tavern = (await call("POST", "/api/tavern")).payload?.data;
const seat = tavern?.rooms?.find((entry) => entry.room.id === roomId);
check(
  "table listed with the line",
  seat?.room?.messages?.some((m) => m.text === "Uivo de teste") === true,
);

const aId = state1?.character?.id;
const mateUserId = "usr_" + Date.now().toString(36) + "_pk" + randomBytes(2).toString("hex");
await client.query("insert into users (id, email, birth_date) values ($1, $2, $3)", [
  mateUserId,
  "packmate@wizold.test",
  "1990-01-01",
]);
const aCookie = cookie;
const matePayload = mateUserId + "." + (Date.now() + 3600000);
const mateToken =
  "wizold_session=" +
  matePayload +
  "." +
  createHmac("sha256", secret).update(matePayload).digest("base64url");
cookie = mateToken;
const mateCreated = await call("POST", "/api/characters", { name: "Companheira", gender: "female" });
check("companheira criada", mateCreated.payload?.ok === true, mateCreated.payload?.message);
const mateId = mateCreated.payload?.data?.characterId;
cookie = aCookie;
const dmBefore = await call("POST", "/api/tavern/direct", { otherId: mateId });
check("DM outside the pack is refused", dmBefore.payload?.ok === false, dmBefore.payload?.message);
const invited = await call("POST", "/api/pack/invites", { id: mateId });
check("pack invite sent", invited.payload?.ok === true, invited.payload?.message);
check(
  "repeated invite is refused",
  (await call("POST", "/api/pack/invites", { id: mateId })).payload?.ok === false,
);
cookie = mateToken;
const inbox = await call("GET", "/api/pack/invites");
const inviteId = inbox.payload?.data?.invites?.[0]?.id;
check("the invitee sees the invite", Boolean(inviteId));
const accepted = await call("POST", "/api/pack/invites/" + inviteId + "/accept");
check(
  "accepting puts the inviter in the accepter's pack",
  accepted.payload?.ok === true && accepted.payload?.state?.pack?.some((m) => m.id === aId) === true,
  accepted.payload?.message,
);
cookie = aCookie;
const aPack = (await call("POST", "/api/state")).payload?.data;
check("the pack is mutual", aPack?.pack?.some((m) => m.id === mateId) === true);
const reinvite = await call("POST", "/api/pack/invites", { id: mateId });
check("does not invite who is already in the pack", reinvite.payload?.ok === false, reinvite.payload?.message);
const dmAfter = await call("POST", "/api/tavern/direct", { otherId: mateId });
check("DM within the pack opens", dmAfter.payload?.ok === true, dmAfter.payload?.message);
const left = await call("DELETE", "/api/pack/" + mateId);
check(
  "leaving the pack removes the companion",
  left.payload?.ok === true && left.payload?.state?.pack?.some((m) => m.id === mateId) !== true,
  left.payload?.message,
);
await client.query("delete from users where id = $1", [mateUserId]);

const bazaar = (await call("GET", "/api/bazaar")).payload?.data;
check("bazaar board is real", Array.isArray(bazaar?.board));
const roster = (await call("GET", "/api/roster")).payload?.data;
check(
  "real roster lists the hunter",
  Array.isArray(roster?.hunters) && roster.hunters.some((hunter) => hunter.name === "Fumaca"),
);
const checkout = await call("POST", "/api/store/checkout", { packId: "one-pouch" });
check(
  "checkout do Stripe abre",
  String(checkout.payload?.data?.url ?? "").startsWith("https://checkout.stripe.com"),
  checkout.payload?.message,
);
const history = (await call("GET", "/api/store/history")).payload?.data;
check(
  "history records the opened session",
  history?.total === 1 && history?.entries?.[0]?.status === "opened",
);
const hook = await fetch(BASE + "/api/stripe/webhook", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}",
});
check("webhook refuses without a signature", hook.status === 400);
const user = (await rows("select id from users where email = $1", [EMAIL]))[0];
check("user in the table", Boolean(user));
const character = (await rows("select * from characters where user_id = $1", [user?.id]))[0];
check("character in the table", character?.name === "Fumaca");
check("hunt persisted", Number(character?.hunts) === 1);
const movement = await rows(
  "select reason from wallet_movements where character_id = $1 order by id",
  [character?.id],
);
check("the ledger holds the starting balance", movement[0]?.reason === "starting_balance");
const diary = await rows("select count(*)::int as n from log_entries where character_id = $1", [
  character?.id,
]);
check("diary persisted", diary[0]?.n > 0);
const table = await rows("select name from tavern_rooms where owner_id = $1", [character?.id]);
check("table in the table", table[0]?.name === "Fogueira");
const blind = await call("DELETE", "/api/characters", { code: "0000" });
check("deletion without a requested code refuses", blind.payload?.ok === false, blind.payload?.message);
const deleteCode = "4321";
await client.query(
  `insert into deletion_codes (user_id, code_hash, expires_at, attempts)
   values ($1, $2, now() + interval '10 minutes', 0)
   on conflict (user_id) do update set
     code_hash = $2, expires_at = now() + interval '10 minutes', attempts = 0`,
  [userId, createHmac("sha256", secret).update(userId + ":" + deleteCode).digest("hex")],
);
const wrongCode = await call("DELETE", "/api/characters", { code: "9999" });
check("wrong code refuses", wrongCode.payload?.ok === false, wrongCode.payload?.message);
const erased = await call("DELETE", "/api/characters", { code: deleteCode });
check("right code erases the account", erased.payload?.ok === true, erased.payload?.message);
await client.query("delete from users where email = $1", [EMAIL]);
const leftovers = await rows(
  `select (select count(*) from users where id = $1)::int
        + (select count(*) from characters where user_id = $1)::int
        + (select count(*) from tavern_rooms where owner_id = $2)::int
        + (select count(*) from tavern_messages where author_id = $2)::int
        + (select count(*) from arena_history where challenger_id = $2 or rival_id = $2)::int
        + (select count(*) from deletion_codes where user_id = $1)::int as n`,
  [user?.id, character?.id],
);
check("nothing remains of the erased user", leftovers[0]?.n === 0);
const ghosts = await rows(
  "select count(*)::int as n from account_departures where email like '%@wizold.test'",
);
check("bench leaves no departure trace", ghosts[0]?.n === 0);
const ghostEntries = await rows(
  "select count(*)::int as n from account_accesses where email like '%@wizold.test'",
);
check("bench leaves no access trace", ghostEntries[0]?.n === 0);
await client.end();
console.log("");
console.log(failures === 0 ? "SMOKE COMPLETE: everything passed" : failures + " failure(s)");
process.exit(failures > 0 ? 1 : 0);
