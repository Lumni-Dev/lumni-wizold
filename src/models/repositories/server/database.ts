import { Pool, type PoolClient } from "pg";

// One pool per server process. The PG* variables come from .env.local, which
// Next loads before this module ever runs. Server-only: importing this from a
// client component would drag pg into the bundle and fail the build, which is
// exactly the alarm we want.

declare global {
  var wizoldPool: Pool | undefined;
}

function createPool(): Pool {
  return new Pool({
    max: 10,
    idleTimeoutMillis: 30_000,
    database: process.env.PGDATABASE ?? "wizold-prod",
    // Managed Postgres (Supabase) refuses plain connections.
    ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined,
  });
}

// In dev, Next re-evaluates modules on edit; the global keeps one pool alive
// instead of leaking a new one per reload.
export const pool: Pool = globalThis.wizoldPool ?? createPool();
globalThis.wizoldPool = pool;

/**
 * Runs work inside one transaction and always releases the client. Every
 * game action goes through here: the row lock taken by the loader keeps two
 * requests from the same player strictly ordered.
 */
export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {}
    throw error;
  } finally {
    client.release();
  }
}
