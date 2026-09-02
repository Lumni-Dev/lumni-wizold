import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

function loadEnv() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}
loadEnv();

const ssl = process.env.PGSSLMODE
  ? { ca: readFileSync(join(ROOT, "certs/supabase-ca.crt"), "utf8"), rejectUnauthorized: true }
  : undefined;

const dry = !process.argv.includes("--apply");

const client = new pg.Client({ ssl });
await client.connect();

try {
  const doomed = await client.query(
    "select c.name, c.level from characters c where c.is_npc order by c.level desc",
  );
  const real = await client.query("select count(*)::int as total from characters where not is_npc");

  console.log("npcs encontrados: " + doomed.rowCount);
  console.log("jogadores reais que ficam intactos: " + real.rows[0].total);
  for (const row of doomed.rows) {
    console.log("  " + String(row.name).padEnd(18) + "NV " + String(row.level).padStart(4));
  }

  if (dry) {
    console.log("");
    console.log("nada foi removido. rode com --apply para apagar de verdade.");
  } else {
    const gone = await client.query(
      "delete from users where id in (select user_id from characters where is_npc) returning id",
    );
    console.log("");
    console.log("removidos: " + gone.rowCount + " npcs (jogadores reais intactos)");
  }
} finally {
  await client.end();
}
