import { NextResponse } from "next/server";
import { pool } from "@/models/repositories/server/database";
import { clientIp } from "../../_lib/api";
import { rateLimit } from "../../_lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!rateLimit("mining-reset:" + clientIp(request), 6, 60000).allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== "Bearer " + secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const result = await pool.query(
      "update characters set mining_count = 0, mining_window_start = null",
    );
    return NextResponse.json({ ok: true, reset: result.rowCount ?? 0 });
  } catch (error) {
    console.error("[api] GET /api/cron/mining-reset", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
