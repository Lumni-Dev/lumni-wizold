import type { PoolClient } from "pg";
import { generateId } from "@/shared/utils/id";

export interface UserRow {
  id: string;
  email: string | null;
  birthDate: string;
  epoch: number;
}

export async function findUserByEmail(client: PoolClient, email: string): Promise<UserRow | null> {
  const found = await client.query(
    "select id, email, birth_date, session_epoch from users where lower(email) = lower($1)",
    [email],
  );
  const row = found.rows[0];
  return row
    ? {
        id: row.id,
        email: row.email,
        birthDate: String(row.birth_date),
        epoch: Number(row.session_epoch),
      }
    : null;
}

export async function createUser(
  client: PoolClient,
  email: string,
  birthDateIso: string,
): Promise<UserRow> {
  const id = generateId("usr");
  await client.query("insert into users (id, email, birth_date) values ($1, $2, $3)", [
    id,
    email,
    birthDateIso,
  ]);
  return { id, email, birthDate: birthDateIso, epoch: 0 };
}
