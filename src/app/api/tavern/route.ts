import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { withTavern } from "../_lib/api";
async function board(request: Request) {
  return withTavern(request, async (state, _body, context) => {
    return NextResponse.json({
      ok: true,
      message: "",
      data: {
        identity: context.identity,
        rooms: tavernController.listRooms(state, context.identity),
      },
    });
  });
}
export async function POST(request: Request) {
  return board(request);
}
