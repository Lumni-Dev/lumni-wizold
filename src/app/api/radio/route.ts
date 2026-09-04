import { NextResponse } from "next/server";
import { listRadioTracks } from "@/models/repositories/server/radio.store";
import { clientIp, refuseAbuse } from "../_lib/api";
import { rateLimit } from "../_lib/rate-limit";

export async function GET(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  if (!rateLimit("radio:" + clientIp(request), 60, 60000).allowed) {
    return NextResponse.json({ ok: false, message: "Devagar.", data: null }, { status: 429 });
  }
  const tracks = await listRadioTracks();
  return NextResponse.json(
    { ok: true, message: "", data: { tracks } },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
