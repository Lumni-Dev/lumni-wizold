import { NextResponse } from "next/server";
import { GAME_VERSION } from "@/shared/constants/version";
import { clientIp, refuseAbuse } from "../_lib/api";
import { rateLimit } from "../_lib/rate-limit";

// The build's current version, read by every open tab to notice a fresh deploy.
// Public and cheap: no session, no database, just the constant the running server
// was built with. An IP budget keeps it from being hammered.
export async function GET(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  if (!rateLimit("version:" + clientIp(request), 60, 60000).allowed) {
    return NextResponse.json({ ok: false, message: "Devagar." }, { status: 429 });
  }
  return NextResponse.json({ version: GAME_VERSION });
}
