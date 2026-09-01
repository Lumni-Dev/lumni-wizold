import { BAZAAR } from "@/shared/config/bazaar";

export interface BazaarListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  enhancement: number;
  quantity: number;
  priceCents: number;
  announcedAt?: string;
}

export const BAZAAR_LISTING_DAYS = BAZAAR.listingDays;
export const BAZAAR_LISTING_LIFETIME_MS = BAZAAR_LISTING_DAYS * 24 * 60 * 60 * 1000;

export function listingExpiresAt(listing: BazaarListing): number {
  const announced = listing.announcedAt ? Date.parse(listing.announcedAt) : Date.now();
  return announced + BAZAAR_LISTING_LIFETIME_MS;
}

export function isListingExpired(listing: BazaarListing, now = Date.now()): boolean {
  return now >= listingExpiresAt(listing);
}

export interface Wallet {
  cents: number;
}

export function initialWallet(): Wallet {
  return { cents: BAZAAR.startingWalletCents };
}
