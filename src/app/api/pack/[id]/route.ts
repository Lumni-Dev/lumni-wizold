import * as packController from "@/controllers/pack.controller";
import { withGame } from "../../_lib/api";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withGame(request, (state) => packController.removeMate(state, id.slice(0, 80)));
}
