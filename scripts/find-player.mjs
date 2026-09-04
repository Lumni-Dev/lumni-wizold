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
const listing = !name || name === "--last";
const howMany = Number(process.argv[3] ?? 5);

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

const { rows } = listing
  ? await client.query(
      `select c.name, c.level, c.gender, c.is_npc, c.created_at, u.email
         from characters c
         join users u on u.id = c.user_id
        where c.is_npc = false
        order by c.created_at desc
        limit $1`,
      [Number.isFinite(howMany) ? howMany : 5],
    )
  : await client.query(
      `select c.name, c.level, c.gender, c.is_npc, c.created_at, u.email
         from characters c
         join users u on u.id = c.user_id
        where lower(c.name) = lower($1)`,
      [name],
    );

if (listing) {
  console.log(JSON.stringify(rows, null, 2));
  await client.end();
  process.exit(0);
}

if (!rows.length) {
  const { rows: near } = await client.query(
    `select c.name, c.level from characters c where c.name ilike $1 order by c.name limit 10`,
    ["%" + name + "%"],
  );
  console.log("nenhum personagem com esse nome exato.");
  if (near.length) console.log("parecidos: " + near.map((row) => row.name).join(", "));
} else {
  console.log(JSON.stringify(rows, null, 2));
}

await client.end();
