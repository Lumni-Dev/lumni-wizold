import { createHmac, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const OUT = join(ROOT, "public", "assets", "landing");
const EMAIL = "landing@wizold.test";

const SHOTS = [
  { key: "character", path: "/character" },
  { key: "hunt", path: "/hunt" },
  { key: "training", path: "/training" },
  { key: "forge", path: "/forge" },
  { key: "arena", path: "/arena" },
  { key: "tavern", path: "/tavern" },
];

for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
}

const secret = process.env.SESSION_SECRET ?? "";
if (secret.length < 32) {
  console.error("SESSION_SECRET missing");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const pg = require(process.cwd() + "/node_modules/pg");
const client = new pg.Client({
  database: "postgres",
  ssl: { ca: readFileSync(join(ROOT, "certs/supabase-ca.crt"), "utf8"), rejectUnauthorized: true },
});
await client.connect();

await client.query("delete from users where email = $1", [EMAIL]);

const userId = "usr_" + Date.now().toString(36) + "_cap" + randomBytes(2).toString("hex");
await client.query("insert into users (id, email, birth_date) values ($1, $2, $3)", [
  userId,
  EMAIL,
  "1990-01-01",
]);

const payload = userId + "." + (Date.now() + 3600000);
const token =
  payload + "." + createHmac("sha256", secret).update(payload).digest("base64url");
const cookie = "wizold_session=" + token;

const created = await fetch(BASE + "/api/characters", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ name: "Tour" + randomBytes(2).toString("hex"), gender: "female" }),
}).then((response) => response.json());

if (!created.ok) {
  console.error("character create failed", created);
  await client.end();
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 648 },
  deviceScaleFactor: 1,
});
await context.addCookies([
  { name: "wizold_session", value: token, domain: "localhost", path: "/" },
]);

const page = await context.newPage();

for (const shot of SHOTS) {
  await page.goto(BASE + shot.path, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const target = join(OUT, shot.key + ".webp");
  await page.screenshot({ path: target, type: "webp", fullPage: false });
  console.log("saved", target);
}

await browser.close();
await client.query("delete from users where id = $1", [userId]);
await client.end();
