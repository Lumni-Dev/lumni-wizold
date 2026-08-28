import type { Gender } from "@/models/entities/character";
import type { RankingKey } from "@/models/entities/ranking";
import { success } from "@/models/entities/result";
import * as rankingController from "@/controllers/ranking.controller";
import { withGame } from "../_lib/api";

export async function GET(request: Request) {
  return withGame(request, (state) => {
    const query = new URL(request.url).searchParams;
    const key = (query.get("board") ?? "level") as RankingKey;
    const page = Number(query.get("page") ?? 1) || 1;
    const search = (query.get("search") ?? "").slice(0, 40);
    const gender = query.get("gender");
    const cut: Gender | "all" = gender === "male" || gender === "female" ? gender : "all";

    return success(state, "", rankingController.listRanking(state, key, page, search, cut));
  });
}
