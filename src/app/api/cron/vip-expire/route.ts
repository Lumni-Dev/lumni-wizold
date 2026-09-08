import { NextResponse } from "next/server";
import { pool } from "@/models/repositories/server/database";
import { clientIp } from "../../_lib/api";
import { rateLimit } from "../../_lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!rateLimit("vip-expire:" + clientIp(request), 6, 60000).allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== "Bearer " + secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const expired = await client.query<{ id: string }>(
      `update characters
          set vip_until = null,
              vip_subscription_id = case
                when vip_canceling then null
                else vip_subscription_id
              end,
              vip_canceling = false
        where vip_until is not null
          and vip_until <= now()
      returning id`,
    );
    const ids = expired.rows.map((row) => row.id);
    let automation = 0;
    if (ids.length > 0) {
      const cleared = await client.query(
        `update automation_settings
            set hunt = false,
                arena = false,
                train = false,
                mine = false,
                forge = false,
                rest = false,
                transform = false,
                potion = false,
                pet_feed = false,
                pet_rest = false
          where character_id = any($1::text[])`,
        [ids],
      );
      automation = cleared.rowCount ?? 0;
    }
    await client.query("commit");
    return NextResponse.json({
      ok: true,
      expired: ids.length,
      automationCleared: automation,
    });
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error("[api] GET /api/cron/vip-expire", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  } finally {
    client.release();
  }
}
