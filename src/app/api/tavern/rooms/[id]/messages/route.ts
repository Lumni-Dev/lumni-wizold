import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { saveTavernDiff } from "@/models/repositories/server/tavern.store";
import { asText, withTavern } from "../../../../_lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withTavern(request, async (state, body, context) => {
    const result = tavernController.sendMessage(
      state,
      id.slice(0, 80),
      context.identity,
      asText(body.text, 240),
    );
    if (result.ok) {
      await saveTavernDiff(context.client, state, result.state, context.tavern.hashes);
    }
    return NextResponse.json({ ok: result.ok, message: result.message, data: null });
  });
}
