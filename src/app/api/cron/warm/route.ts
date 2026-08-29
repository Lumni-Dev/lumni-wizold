import { NextResponse } from "next/server";
import { pool } from "@/models/repositories/server/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await pool.query("select 1");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api] GET /api/cron/warm", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
