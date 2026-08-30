import { NextResponse } from "next/server";
import { GAME_VERSION } from "@/shared/constants/version";
import { clientIp, refuseAbuse } from "../_lib/api";
import { rateLimit } from "../_lib/rate-limit";

export async function GET(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  if (!rateLimit("version:" + clientIp(request), 60, 60000).allowed) {
    return NextResponse.json({ ok: false, message: "Devagar." }, { status: 429 });
  }
  return NextResponse.json({ version: GAME_VERSION });
}
