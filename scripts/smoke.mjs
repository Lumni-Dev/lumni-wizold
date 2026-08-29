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
const anonymous = await call("POST", "/api/state");
check("sem sessão é 401", anonymous.status === 401);
const warm = await call("GET", "/api/cron/warm");
check(
  "aquecedor responde ou fica atrás do escudo",
  (warm.status === 200 && warm.payload?.ok === true) || warm.status === 403,
  String(warm.status),
);
const minor = await call("POST", "/api/auth/enter", {
  credential: "qualquer.coisa.aqui",
  birth: { day: "01", month: "01", year: "2012" },
});
check("menor de 18 é 403", minor.status === 403, minor.payload?.message);
const forged = await call("POST", "/api/auth/enter", {
  credential: "cabeca.corpo.assinatura-forjada",
  birth: { day: "01", month: "01", year: "1990" },
});
check("credencial forjada é 401", forged.status === 401, forged.payload?.message);
const secret = process.env.SESSION_SECRET ?? "";
check("segredo da sessão à mão", secret.length >= 32);
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
check("sessão assinada abre a porta", me.payload?.data?.userId === userId);
check("ainda sem personagem", me.payload?.data?.hasCharacter === false);
const badName = await call("POST", "/api/characters", { name: "dois nomes", gender: "female" });
check("nome com espaço recusa", badName.payload?.ok === false);
const created = await call("POST", "/api/characters", { name: "Fumaca", gender: "female" });
check("personagem criado", created.payload?.ok === true, created.payload?.message);
const state1 = (await call("POST", "/api/state")).payload?.data;
check("nasce com 100 de bronze", state1?.character?.bronze === 100);
check("carteira nasce com R$ 10", state1?.wallet?.cents === 1000);
check("dez poções na mochila", state1?.inventory?.[0]?.quantity === 10);
const turned = await call("POST", "/api/character/transform");
check("transformação cobra 40 de fúria", turned.payload?.ok === true);
const laidDown = await call("POST", "/api/character/rest");
check("repouso aceito com a fúria gasta", laidDown.payload?.ok === true, laidDown.payload?.message);
const turnedAgain = await call("POST", "/api/character/transform");
check("virar a fera de novo", turnedAgain.payload?.ok === true, turnedAgain.payload?.message);
const staleCollect = await call("PATCH", "/api/character/rest");
check(
  "atividade derruba o repouso no servidor",
  staleCollect.payload?.ok === false,
  staleCollect.payload?.message,
);
const hunt = await call("POST", "/api/hunt", { territoryId: "village-field" });
const report = hunt.payload?.data;
check("caçada resolve e pousa", hunt.payload?.ok === true && Array.isArray(report?.combat?.rounds));
const state2 = (await call("POST", "/api/state")).payload?.data;
check("caçada contou", state2?.character?.hunts === 1);
const bought = await call("POST", "/api/market/buy", {
  itemId: "health-potion-small",
  quantity: 1,
});
check("compra no mercado", bought.payload?.ok === true, bought.payload?.message);
const state3 = (await call("POST", "/api/state")).payload?.data;
check("bronze desceu o preço", state3?.character?.bronze === state2?.character?.bronze - 60);
const trained = await call("POST", "/api/training/session", { exerciseId: "ice-bath" });
check("sessão de treino", trained.payload?.ok === true, trained.payload?.message);
check(
  "arena nasce sem duelo gasto",
  state3?.arenaDuels !== null &&
    typeof state3?.arenaDuels === "object" &&
    Object.keys(state3.arenaDuels).length === 0,
);
const room = await call("POST", "/api/tavern/rooms", { name: "Fogueira", password: "" });
check("mesa aberta", room.payload?.ok === true, room.payload?.message);
const roomId = room.payload?.data?.roomId;
const spoke = await call("POST", "/api/tavern/rooms/" + roomId + "/messages", {
  text: "Uivo de teste",
});
check("fala registrada", spoke.payload?.ok === true);
const linked = await call("POST", "/api/tavern/rooms/" + roomId + "/messages", {
  text: "vem ver https://exemplo.com",
});
check("link na mesa é recusado", linked.payload?.ok === false, linked.payload?.message);
const tavern = (await call("POST", "/api/tavern")).payload?.data;
const seat = tavern?.rooms?.find((entry) => entry.room.id === roomId);
check(
  "mesa listada com a fala",
  seat?.room?.messages?.some((m) => m.text === "Uivo de teste") === true,
);
const bazaar = (await call("GET", "/api/bazaar")).payload?.data;
check("quadro do bazar é real", Array.isArray(bazaar?.board));
const roster = (await call("GET", "/api/roster")).payload?.data;
check(
  "plantel real lista o caçador",
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
  "histórico registra a sessão aberta",
  history?.total === 1 && history?.entries?.[0]?.status === "opened",
);
const hook = await fetch(BASE + "/api/stripe/webhook", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}",
});
check("webhook recusa sem assinatura", hook.status === 400);
const user = (await rows("select id from users where email = $1", [EMAIL]))[0];
check("usuário na tabela", Boolean(user));
const character = (await rows("select * from characters where user_id = $1", [user?.id]))[0];
check("personagem na tabela", character?.name === "Fumaca");
check("caçada persistida", Number(character?.hunts) === 1);
const movement = await rows(
  "select reason from wallet_movements where character_id = $1 order by id",
  [character?.id],
);
check("ledger tem o saldo inicial", movement[0]?.reason === "starting_balance");
const diary = await rows("select count(*)::int as n from log_entries where character_id = $1", [
  character?.id,
]);
check("diário persistido", diary[0]?.n > 0);
const table = await rows("select name from tavern_rooms where owner_id = $1", [character?.id]);
check("mesa na tabela", table[0]?.name === "Fogueira");
const blind = await call("DELETE", "/api/characters", { code: "0000" });
check("exclusão sem código pedido recusa", blind.payload?.ok === false, blind.payload?.message);
const deleteCode = "4321";
await client.query(
  `insert into deletion_codes (user_id, code_hash, expires_at, attempts)
   values ($1, $2, now() + interval '10 minutes', 0)
   on conflict (user_id) do update set
     code_hash = $2, expires_at = now() + interval '10 minutes', attempts = 0`,
  [userId, createHmac("sha256", secret).update(userId + ":" + deleteCode).digest("hex")],
);
const wrongCode = await call("DELETE", "/api/characters", { code: "9999" });
check("código errado recusa", wrongCode.payload?.ok === false, wrongCode.payload?.message);
const erased = await call("DELETE", "/api/characters", { code: deleteCode });
check("código certo apaga a conta", erased.payload?.ok === true, erased.payload?.message);
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
check("nada sobra do usuário apagado", leftovers[0]?.n === 0);
await client.end();
console.log("");
console.log(failures === 0 ? "SMOKE COMPLETO: tudo passou" : failures + " falha(s)");
process.exit(failures > 0 ? 1 : 0);
