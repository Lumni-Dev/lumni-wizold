import type { PoolClient } from "pg";
import type { BazaarListing } from "@/models/entities/bazaar";

function asListing(row: Record<string, unknown>): BazaarListing {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    sellerName: String(row.seller_name),
    itemId: String(row.item_id),
    enhancement: Number(row.enhancement),
    quantity: Number(row.quantity),
    priceCents: Number(row.price_cents),
    announcedAt: new Date(String(row.announced_at)).toISOString(),
    sellerHouse: row.seller_house === true,
  };
}

export async function loadOthersListings(
  client: PoolClient,
  characterId: string,
): Promise<BazaarListing[]> {
  const found = await client.query(
    `select l.id, l.seller_id, l.item_id, l.enhancement, l.quantity, l.price_cents,
            l.announced_at, c.name as seller_name, c.is_npc as seller_house
       from bazaar_listings l
       join characters c on c.id = l.seller_id
      where l.status = 'active' and l.seller_id <> $1
      order by l.announced_at desc`,
    [characterId],
  );
  return found.rows.map(asListing);
}

export async function lockListing(
  client: PoolClient,
  listingId: string,
): Promise<BazaarListing | null> {
  const found = await client.query(
    `select l.id, l.seller_id, l.item_id, l.enhancement, l.quantity, l.price_cents,
            l.announced_at, c.name as seller_name, c.is_npc as seller_house
       from bazaar_listings l
       join characters c on c.id = l.seller_id
      where l.id = $1 and l.status = 'active'
        for update of l`,
    [listingId],
  );
  const row = found.rows[0];
  return row ? asListing(row) : null;
}

export async function settleSale(
  client: PoolClient,
  listing: BazaarListing,
  quantitySold: number,
  buyerName: string,
  netCents: number,
): Promise<void> {
  const remaining = listing.quantity - quantitySold;
  await client.query(
    `update bazaar_listings set
       quantity = case when $2 > 0 then $2 else quantity end,
       status = case when $2 <= 0 then 'sold'::listing_status else status end,
       settled_at = case when $2 <= 0 then now() else settled_at end,
       buyer_name = $3,
       net_cents = coalesce(net_cents, 0) + $4
     where id = $1`,
    [listing.id, remaining, buyerName, netCents],
  );
  await client.query("update wallets set cents = cents + $2 where character_id = $1", [
    listing.sellerId,
    netCents,
  ]);
}

export async function logSale(
  client: PoolClient,
  logId: string,
  sellerId: string,
  message: string,
): Promise<void> {
  await client.query(
    "insert into log_entries (id, character_id, kind, message) values ($1, $2, 'market', $3)",
    [logId, sellerId, message],
  );
}
