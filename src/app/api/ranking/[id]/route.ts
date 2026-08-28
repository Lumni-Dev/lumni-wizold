import { failure, success } from "@/models/entities/result";
import * as rankingController from "@/controllers/ranking.controller";
import { withGame } from "../../_lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withGame(request, (state) => {
    const profile = rankingController.profileOf(state, id.slice(0, 80));
    return profile
      ? success(state, "", profile)
      : failure(state, "Esse caçador não está em nenhum quadro.");
  });
}
