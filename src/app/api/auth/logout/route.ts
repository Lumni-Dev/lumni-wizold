import { NextResponse } from "next/server";
import { dropSession } from "../../_lib/session";

export async function POST() {
  await dropSession();
  return NextResponse.json({ ok: true, message: "Sessão encerrada.", data: null });
}
