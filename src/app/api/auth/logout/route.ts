import { NextResponse } from "next/server";
import { dropSession } from "../../_lib/session";
import { refuseAbuse } from "../../_lib/api";

export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  await dropSession();
  return NextResponse.json({ ok: true, message: "Sessão encerrada.", data: null });
}
