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
const anonymous = await call("GET", "/api/state");
check("sem sessão é 401", anonymous.status === 401);
const minor = await call("POST", "/api/auth/enter", {
  email: "menor@wizold.test",
  birth: { day: "01", month: "01", year: "2012" },
});
check("menor de 18 é 403", minor.status === 403, minor.payload?.message);
cookie = "";
const entered = await call("POST", "/api/auth/enter", {
  email: EMAIL,
  birth: { day: "01", month: "01", year: "1990" },
});
check("conta criada e sessão emitida", entered.status === 200 && cookie.length > 20);
check("ainda sem personagem", entered.payload?.data?.hasCharacter === false);
const badName = await call("POST", "/api/characters", { name: "dois nomes", gender: "female" });
check("nome com espaço recusa", badName.payload?.ok === false);
const created = await call("POST", "/api/characters", { name: "Fumaca", gender: "female" });
check("personagem criado", created.payload?.ok === true, created.payload?.message);
const state1 = (await call("GET", "/api/state")).payload?.data;
check("nasce com 100 de bronze", state1?.character?.bronze === 100);
check("carteira nasce com R$ 10", state1?.wallet?.cents === 1000);
check("dez poções na mochila", state1?.inventory?.[0]?.quantity === 10);
const turned = await call("POST", "/api/character/transform");
check("transformação cobra 40 de fúria", turned.payload?.ok === true);
const hunt = await call("POST", "/api/hunt", { territoryId: "village-field" });
const report = hunt.payload?.data;
check("caçada resolve e pousa", hunt.payload?.ok === true && Array.isArray(report?.combat?.rounds));
const state2 = (await call("GET", "/api/state")).payload?.data;
check("caçada contou", state2?.character?.hunts === 1);
const bought = await call("POST", "/api/market/buy", {
  itemId: "health-potion-small",
  quantity: 1,
});
check("compra no mercado", bought.payload?.ok === true, bought.payload?.message);
const state3 = (await call("GET", "/api/state")).payload?.data;
check("bronze desceu o preço", state3?.character?.bronze === state2?.character?.bronze - 60);
const trained = await call("POST", "/api/training/session", { exerciseId: "ice-bath" });
check("sessão de treino", trained.payload?.ok === true, trained.payload?.message);
const arena = (await call("GET", "/api/arena")).payload?.data;
check("arena abre com três ataques", arena?.charges?.left === 3);
const room = await call("POST", "/api/tavern/rooms", { name: "Fogueira", password: "" });
check("mesa aberta", room.payload?.ok === true, room.payload?.message);
const roomId = room.payload?.data?.roomId;
const spoke = await call("POST", "/api/tavern/rooms/" + roomId + "/messages", {
  text: "Uivo de teste",
});
check("fala registrada", spoke.payload?.ok === true);
const tavern = (await call("GET", "/api/tavern")).payload?.data;
const seat = tavern?.rooms?.find((entry) => entry.room.id === roomId);
check(
  "mesa listada com a fala",
  seat?.room?.messages?.some((m) => m.text === "Uivo de teste") === true,
);
const bazaar = (await call("GET", "/api/bazaar")).payload?.data;
check("quadro do bazar vem do elenco", Array.isArray(bazaar?.board) && bazaar.board.length > 0);
const require = createRequire(import.meta.url);
const pg = require(process.cwd() + "/node_modules/pg");
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}
const client = new pg.Client({
  database: "postgres",
  ssl: { ca: readFileSync(join(ROOT, "certs/supabase-ca.crt"), "utf8"), rejectUnauthorized: true },
});
await client.connect();
const rows = async (sql, params) => (await client.query(sql, params)).rows;
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
await client.query("delete from users where email in ($1, $2)", [EMAIL, "menor@wizold.test"]);
const leftovers = await rows(
  "select (select count(*) from characters where user_id = $1)::int + (select count(*) from tavern_rooms where owner_id = $2)::int as n",
  [user?.id, character?.id],
);
check("limpeza em cascata completa", leftovers[0]?.n === 0);
await client.end();
console.log("");
console.log(failures === 0 ? "SMOKE COMPLETO: tudo passou" : failures + " falha(s)");
process.exit(failures > 0 ? 1 : 0);
