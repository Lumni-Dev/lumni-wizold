import { intBetween, pickOne, seededRandom, spread } from "@/shared/utils/random";
import type { BazaarListing } from "../entities/bazaar";
import { ORES } from "../entities/mining";
import { suggestedPriceCents } from "../rules/bazaar";
import { findItem } from "./items";
import { RIVALS } from "./rivals";

const SEED = 20_260_831;
const MAX_LISTINGS = 60;

function roundPrice(cents: number): number {
  return Math.max(100, Math.round(cents / 10) * 10);
}

function buildListings(): BazaarListing[] {
  const random = seededRandom(SEED);
  const listings: BazaarListing[] = [];

  for (const rival of RIVALS) {
    if (listings.length >= MAX_LISTINGS) break;

    for (const [itemId, level] of Object.entries(rival.enhancements)) {
      if (listings.length >= MAX_LISTINGS) break;
      if (level <= 0 || random() >= 0.15) continue;

      const item = findItem(itemId);
      if (!item) continue;

      listings.push({
        id: "bz-" + rival.id + "-" + itemId,
        sellerId: rival.id,
        sellerName: rival.name,
        itemId,
        enhancement: level,
        quantity: 1,
        priceCents: roundPrice(suggestedPriceCents(item, level) * spread(0.3, random)),
      });
    }

    if (listings.length < MAX_LISTINGS && random() < 0.18) {
      const open = ORES.filter((ore) => ore.requiredLevel <= rival.mining);
      if (open.length === 0) continue;

      const ore = pickOne(open, random);
      const item = findItem(ore.fragmentId);
      if (!item) continue;

      listings.push({
        id: "bz-" + rival.id + "-" + ore.fragmentId,
        sellerId: rival.id,
        sellerName: rival.name,
        itemId: ore.fragmentId,
        enhancement: 0,
        quantity: intBetween(5, 30, random),
        priceCents: roundPrice(suggestedPriceCents(item, 0) * spread(0.25, random)),
      });
    }
  }

  return listings.sort((a, b) => a.priceCents - b.priceCents);
}

export const ROSTER_LISTINGS: readonly BazaarListing[] = buildListings();

export function findRosterListing(listingId: string): BazaarListing | undefined {
  return ROSTER_LISTINGS.find((listing) => listing.id === listingId);
}
