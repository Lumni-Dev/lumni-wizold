import { createHmac, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.SMOKE_BASE ?? "http://localhost:3001";
// Production only (no Next.js dev badge): npm run build && PORT=3001 npm run start
// then node scripts/capture-landing.mjs
const OUT = join(ROOT, "public", "assets", "landing");
const EMAIL = "landing@wizold.test";

const SHOTS = [
  { key: "character", path: "/character", ready: "Personagem" },
  { key: "hunt", path: "/hunt", ready: "Caça" },
  { key: "training", path: "/training", ready: "Treinamento" },
  { key: "market", path: "/market", ready: "Mercado", mark: "Comprar", settle: 4000 },
  { key: "forge", path: "/forge", ready: "Forja" },
  { key: "arena", path: "/arena", ready: "Arena" },
  { key: "tavern", path: "/tavern", ready: "Taverna" },
];

const ONLY = process.argv[2];
const shots = ONLY ? SHOTS.filter((shot) => shot.key === ONLY) : SHOTS;
if (ONLY && shots.length === 0) {
  console.error("unknown shot:", ONLY);
  process.exit(1);
}

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
const epoch = 0;
await client.query(
  "insert into users (id, email, birth_date, session_epoch) values ($1, $2, $3, $4)",
  [userId, EMAIL, "1990-01-01", epoch],
);

const expiry = Date.now() + 3600000;
const payload = userId + "." + epoch + "." + expiry;
const token =
  payload + "." + createHmac("sha256", secret).update(payload).digest("base64url");
const cookie = "wizold_session=" + token;

const createResponse = await fetch(BASE + "/api/characters", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ name: "Tour" + randomBytes(2).toString("hex"), gender: "female" }),
});
const createBody = await createResponse.text();
let created;
try {
  created = createBody ? JSON.parse(createBody) : null;
} catch {
  console.error("character create returned non-json", createResponse.status, createBody);
  await client.end();
  process.exit(1);
}

if (!created?.ok) {
  console.error("character create failed", createResponse.status, created ?? createBody);
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
  {
    name: "wizold_session",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  },
]);

const page = await context.newPage();

async function stripDevChrome(page) {
  await page.evaluate(() => {
    const selectors = [
      "nextjs-portal",
      "#devtools-indicator",
      "[data-nextjs-toast]",
      "[data-nextjs-dev-tools-button]",
      "[data-next-badge-root]",
      "[data-nextjs-dev-overlay]",
      "#__next-build-watcher",
    ];
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((node) => node.remove());
    }
    document.querySelectorAll("body *").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const label = node.getAttribute("aria-label") ?? "";
      if (label.includes("Open Next.js Dev Tools") || label.includes("Turbopack")) {
        node.remove();
      }
    });
  });
}

async function waitForReady(page, shot) {
  await page.waitForFunction(
    () => !document.body.innerText.includes("Carregando..."),
    null,
    { timeout: 90_000 },
  );
  if (shot.ready) {
    await page.getByRole("heading", { name: shot.ready, level: 1 }).waitFor({
      state: "visible",
      timeout: 90_000,
    });
  }
  if (shot.mark) {
    await page.getByText(shot.mark, { exact: true }).first().waitFor({
      state: "visible",
      timeout: 90_000,
    });
  }
  await page.waitForTimeout(shot.settle ?? 3500);
  await stripDevChrome(page);
}

for (const shot of shots) {
  await page.goto(BASE + shot.path, { waitUntil: "load", timeout: 90_000 });
  await waitForReady(page, shot);
  const target = join(OUT, shot.key + ".webp");
  await page.screenshot({ path: target, type: "webp", fullPage: false });
  console.log("saved", target);
}

await browser.close();
await client.query("delete from users where id = $1", [userId]);
await client.end();
