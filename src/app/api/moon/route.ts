import { NextResponse } from "next/server";
import { serverMoon } from "../_lib/moon";
import { clientIp, refuseAbuse } from "../_lib/api";
import { rateLimit } from "../_lib/rate-limit";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  if (!rateLimit("moon:" + clientIp(request), 30, 60000).allowed) {
    return NextResponse.json({ ok: false, message: "Devagar." }, { status: 429 });
  }
  const moon = await serverMoon();
  return NextResponse.json({
    phase: moon.phase.key,
    age: moon.age,
    illumination: moon.illumination,
    waxing: moon.waxing,
    source: moon.source,
  });
}
