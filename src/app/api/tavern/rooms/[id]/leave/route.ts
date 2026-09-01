import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { commitTavernWrite } from "@/app/api/_lib/tavern-commit";
import { withTavernRoom } from "../../../../_lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withTavernRoom(request, id.slice(0, 80), async (state, _body, context) => {
    const result = tavernController.leaveRoom(state, id.slice(0, 80), context.identity);
    if (result.ok) {
      await commitTavernWrite(context.client, state, result.state, context.tavern.hashes);
    }
    return NextResponse.json({ ok: result.ok, message: result.message, data: null });
  });
}
