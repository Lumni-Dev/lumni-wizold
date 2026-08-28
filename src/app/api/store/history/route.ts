import { success } from "@/models/entities/result";
import { withGame } from "../../_lib/api";

const PAGE_SIZE = 5;

export async function GET(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const wanted = Number(new URL(request.url).searchParams.get("page") ?? 1) || 1;
    const counted = await context.client.query(
      "select count(*)::int as total from store_purchases where character_id = $1",
      [context.characterId],
    );
    const total = counted.rows[0]?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, Math.floor(wanted)), pages);
    const found = await context.client.query(
      `select id, pack_id, price_cents, purchased_at,
              case
                when status = 'opened' and purchased_at < now() - interval '24 hours'
                  then 'expired'
                else status
              end as status
         from store_purchases
        where character_id = $1
        order by purchased_at desc
        limit $2 offset $3`,
      [context.characterId, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    );
    return success(state, "", {
      entries: found.rows.map((row) => ({
        id: String(row.id),
        packId: String(row.pack_id),
        priceCents: Number(row.price_cents),
        status: String(row.status),
        at: new Date(row.purchased_at).toISOString(),
      })),
      page,
      pages,
      total,
    });
  });
}
