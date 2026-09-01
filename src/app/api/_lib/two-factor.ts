import { randomInt, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";
import { deletionCodeHash } from "./session";

const MAX_ATTEMPTS = 5;
const CODE_PATTERN = /^\d{8}$/;

export function isTwoFactorCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

export function mintTwoFactorCode(): string {
  return String(randomInt(0, 100_000_000)).padStart(8, "0");
}

export async function saveTwoFactorCode(
  client: PoolClient,
  userId: string,
  code: string,
): Promise<void> {
  await client.query(
    `insert into two_factor_codes (user_id, code_hash, expires_at, attempts)
     values ($1, $2, now() + interval '10 minutes', 0)
     on conflict (user_id) do update set
       code_hash = $2, expires_at = now() + interval '10 minutes', attempts = 0`,
    [userId, deletionCodeHash(userId, code)],
  );
}

export async function verifyTwoFactorCode(
  client: PoolClient,
  userId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isTwoFactorCode(code)) {
    return { ok: false, message: "O código tem oito dígitos." };
  }

  const found = await client.query(
    `select code_hash, expires_at, attempts
     from two_factor_codes where user_id = $1 for update`,
    [userId],
  );
  const row = found.rows[0];
  if (!row) return { ok: false, message: "Peça um código novo." };
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    return { ok: false, message: "O código expirou. Peça outro." };
  }
  if (Number(row.attempts) >= MAX_ATTEMPTS) {
    return { ok: false, message: "Muitas tentativas erradas. Peça um código novo." };
  }

  const wanted = Buffer.from(String(row.code_hash), "hex");
  const given = Buffer.from(deletionCodeHash(userId, code), "hex");
  if (wanted.length !== given.length || !timingSafeEqual(wanted, given)) {
    await client.query("update two_factor_codes set attempts = attempts + 1 where user_id = $1", [
      userId,
    ]);
    return { ok: false, message: "Código errado." };
  }

  await client.query("delete from two_factor_codes where user_id = $1", [userId]);
  return { ok: true };
}
