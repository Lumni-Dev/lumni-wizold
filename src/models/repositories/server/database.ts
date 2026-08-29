import { Pool, type PoolClient } from "pg";
import { SUPABASE_CA } from "./supabase-ca";
declare global {
  var wizoldPool: Pool | undefined;
}
function createPool(): Pool {
  const pool = new Pool({
    max: 10,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    database: process.env.PGDATABASE ?? "wizold-prod",
    ssl: process.env.PGSSLMODE ? { ca: SUPABASE_CA, rejectUnauthorized: true } : undefined,
  });
  return pool;
}
export const pool: Pool = globalThis.wizoldPool ?? createPool();
globalThis.wizoldPool = pool;
const prepared = new WeakSet<PoolClient>();
export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    if (!prepared.has(client)) {
      await client.query("set statement_timeout = '10s'");
      prepared.add(client);
    }
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
