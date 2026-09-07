import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const found = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (found && !process.env[found[1]]) process.env[found[1]] = found[2].replace(/^["']|["']$/g, "");
}

const name = process.argv[2];
const years = Number(process.argv[3] ?? 1);

if (!name || !Number.isInteger(years) || years <= 0) {
  console.log("usage: node scripts/grant-vip.mjs <character name> <whole years>");
  process.exit(1);
}

const client = new Client({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : { ca: readFileSync(join(ROOT, "certs", "supabase-ca.crt"), "utf8"), rejectUnauthorized: true },
});

await client.connect();

const { rows: before } = await client.query(
  `select id, name, level, vip_until, vip_canceling from characters where lower(name) = lower($1)`,
  [name],
);

if (before.length !== 1) {
  console.log(before.length === 0 ? "no character with that name" : "more than one character with that name");
  await client.end();
  process.exit(1);
}

console.log("antes: " + JSON.stringify(before[0]));

const { rows: after } = await client.query(
  `update characters
      set vip_until = greatest(coalesce(vip_until, now()), now()) + ($2 || ' years')::interval
    where id = $1
    returning id, name, vip_until, vip_canceling`,
  [before[0].id, String(years)],
);

console.log("depois: " + JSON.stringify(after[0]));

await client.end();
