import type { PoolClient } from "pg";
import { generateId } from "@/shared/utils/id";

export interface UserRow {
  id: string;
  email: string | null;
  birthDate: string;
  epoch: number;
  twoFactorEnabled: boolean;
  tutorial: boolean;
  banished: boolean;
}

function asUser(row: {
  id: string;
  email: string | null;
  birth_date: string;
  session_epoch: number;
  two_factor_enabled: boolean;
  tutorial: boolean;
  banished: boolean;
}): UserRow {
  return {
    id: row.id,
    email: row.email,
    birthDate: String(row.birth_date),
    epoch: Number(row.session_epoch),
    twoFactorEnabled: row.two_factor_enabled === true,
    tutorial: row.tutorial === true,
    banished: row.banished === true,
  };
}

export async function findUserByEmail(client: PoolClient, email: string): Promise<UserRow | null> {
  const found = await client.query(
    "select id, email, birth_date, session_epoch, two_factor_enabled, tutorial, banished from users where lower(email) = lower($1)",
    [email],
  );
  const row = found.rows[0];
  return row ? asUser(row) : null;
}

export async function createUser(
  client: PoolClient,
  email: string,
  birthDateIso: string,
): Promise<UserRow> {
  const id = generateId("usr");
  await client.query(
    "insert into users (id, email, birth_date, tutorial) values ($1, $2, $3, false)",
    [id, email, birthDateIso],
  );
  return {
    id,
    email,
    birthDate: birthDateIso,
    epoch: 0,
    twoFactorEnabled: false,
    tutorial: false,
    banished: false,
  };
}

export async function isTutorialDone(client: PoolClient, userId: string): Promise<boolean> {
  const found = await client.query("select tutorial from users where id = $1", [userId]);
  return found.rows[0]?.tutorial === true;
}

export async function markTutorialDone(client: PoolClient, userId: string): Promise<void> {
  await client.query("update users set tutorial = true where id = $1", [userId]);
}
