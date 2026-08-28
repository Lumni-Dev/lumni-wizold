import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const PLAYERS = Math.min(50, Number(process.env.LOAD_PLAYERS ?? 12) || 12);
const HUNTS = 6;
const latencies = [];
let errors = 0;
async function call(cookieBox, method, path, body) {
  const startedAt = performance.now();
  const response = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", cookie: cookieBox.value },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  latencies.push(performance.now() - startedAt);
  for (const line of response.headers.getSetCookie?.() ?? []) {
    if (line.startsWith("wizold_session=")) cookieBox.value = line.split(";")[0];
  }
  if (response.status >= 500) errors += 1;
  try {
    return { status: response.status, payload: await response.json() };
  } catch {
    return { status: response.status, payload: null };
  }
}
async function playerRun(index) {
  const cookieBox = { value: "" };
  const email = "load-" + index + "@wizold.test";
  await call(cookieBox, "POST", "/api/auth/enter", {
    email,
    birth: { day: "01", month: "01", year: "1990" },
  });
  await call(cookieBox, "POST", "/api/characters", {
    name: "Carga" + index,
    gender: index % 2 ? "female" : "male",
  });
  await call(cookieBox, "POST", "/api/character/transform");
  for (let hunt = 0; hunt < HUNTS; hunt += 1) {
    await call(cookieBox, "POST", "/api/hunt", { territoryId: "village-field" });
  }
  await call(cookieBox, "POST", "/api/market/buy", { itemId: "health-potion-small", quantity: 1 });
  await call(cookieBox, "GET", "/api/state");
  return cookieBox;
}
console.log(PLAYERS + " jogadores concorrentes, " + HUNTS + " caçadas cada, contra " + BASE);
const startedAt = performance.now();
const boxes = await Promise.all(Array.from({ length: PLAYERS }, (_, index) => playerRun(index)));
const wallMs = performance.now() - startedAt;
const burstBox = boxes[0];
let burst429 = 0;
await Promise.all(
  Array.from({ length: 90 }, async () => {
    const result = await call(burstBox, "GET", "/api/state");
    if (result.status === 429) burst429 += 1;
  }),
);
const sorted = [...latencies].sort((a, b) => a - b);
const at = (share) =>
  Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))]);
const total = latencies.length;
console.log("");
console.log("requisições:", total, "em", (wallMs / 1000).toFixed(1) + "s de fase de jogo");
console.log("vazão da fase de jogo:", ((total - 90) / (wallMs / 1000)).toFixed(1), "req/s");
console.log(
  "latência p50:",
  at(0.5) + "ms   p95:",
  at(0.95) + "ms   máx:",
  Math.round(sorted[sorted.length - 1]) + "ms",
);
console.log("erros 5xx:", errors, "   429 na rajada proposital:", burst429);
const require = createRequire(import.meta.url);
const pg = require(join(ROOT, "node_modules/pg"));
for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
}
const client = new pg.Client({
  database: process.env.PGDATABASE ?? "postgres",
  ssl: process.env.PGSSLMODE
    ? { ca: readFileSync(join(ROOT, "certs/supabase-ca.crt"), "utf8"), rejectUnauthorized: true }
    : undefined,
});
await client.connect();
const gone = await client.query("delete from users where email like 'load-%@wizold.test'");
await client.end();
console.log("limpeza:", gone.rowCount, "contas de carga removidas por cascata");
const healthy = errors === 0 && burst429 > 0;
console.log(healthy ? "CARGA OK: sem 5xx e o limitador mordeu a rajada" : "CARGA COM PROBLEMAS");
process.exit(healthy ? 0 : 1);
