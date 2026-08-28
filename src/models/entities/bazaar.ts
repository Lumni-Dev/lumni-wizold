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

export interface Wallet {
  cents: number;
}

export const STARTING_WALLET_CENTS = 1_000;

export function initialWallet(): Wallet {
  return { cents: STARTING_WALLET_CENTS };
}
