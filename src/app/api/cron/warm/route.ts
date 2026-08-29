import { NextResponse } from "next/server";
import { pool } from "@/models/repositories/server/database";
import { clientIp } from "../../_lib/api";
import { rateLimit } from "../../_lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!rateLimit("warm:" + clientIp(request), 12, 60000).allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  try {
    await pool.query("select 1");
    await pool.query("delete from rate_limits where window_start < now() - interval '1 hour'");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api] GET /api/cron/warm", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
