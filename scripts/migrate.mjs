// Migration runner: creates the database when missing, applies every pending
// file in migrations/ in filename order, one transaction each, and records
// the applied ones in schema_migrations. An applied file is immutable; a
// schema change is always a new numbered file.
//
//   node scripts/migrate.mjs          applies what is pending
//   node scripts/migrate.mjs status   lists applied and pending
//
// Connection comes from PG* variables, read from .env.local when present.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MIGRATIONS = join(ROOT, "migrations");

function loadEnv() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

loadEnv();
const DATABASE = process.env.PGDATABASE ?? "wizold-prod";

// Managed Postgres (Supabase) refuses plain connections; PGSSLMODE=require
// in .env.local turns this on.
const ssl = process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined;

async function ensureDatabase() {
  const client = new pg.Client({ database: "postgres", ssl });
  await client.connect();
  try {
    const found = await client.query("select 1 from pg_database where datname = $1", [DATABASE]);
    if (found.rowCount === 0) {
      await client.query('create database "' + DATABASE.replaceAll('"', '""') + '"');
      console.log('banco "' + DATABASE + '" criado');
    }
  } finally {
    await client.end();
  }
}

function pendingOf(applied) {
  return readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({ file, applied: applied.has(file) }));
}

async function run() {
  const command = process.argv[2] ?? "apply";

  await ensureDatabase();
  const client = new pg.Client({ database: DATABASE, ssl });
  await client.connect();

  try {
    await client.query(
      "create table if not exists schema_migrations (" +
        "name text primary key, applied_at timestamptz not null default now())",
    );
    const rows = await client.query("select name from schema_migrations");
    const applied = new Set(rows.rows.map((row) => row.name));
    const files = pendingOf(applied);

    if (command === "status") {
      for (const { file, applied: done } of files) {
        console.log((done ? "aplicada " : "pendente ") + " " + file);
      }
      const missing = applied.difference(new Set(files.map((entry) => entry.file)));
      for (const name of missing) console.log("aplicada, mas o arquivo sumiu: " + name);
      return;
    }

    let count = 0;
    for (const { file, applied: done } of files) {
      if (done) continue;
      const sql = readFileSync(join(MIGRATIONS, file), "utf8");
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
        console.log("aplicada  " + file);
        count += 1;
      } catch (error) {
        await client.query("rollback");
        console.error("falhou    " + file);
        console.error(String(error.message ?? error));
        process.exitCode = 1;
        return;
      }
    }
    console.log(count === 0 ? "nada pendente" : count + " migração(ões) aplicada(s)");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(String(error.message ?? error));
  process.exitCode = 1;
});
