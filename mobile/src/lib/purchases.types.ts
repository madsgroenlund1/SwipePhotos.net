export interface StoreProduct {
  id: string;
  displayPrice: string;
  /** numeric price in the store currency (for per-month maths) */
  price?: number;
  currency?: string;
  /** Google Play: the base-plan offer to buy */
  offerToken?: string;
}

export type StorePlatform = "ios" | "android";

/** A purchase the user owns: `token` is the signed transaction (iOS) or purchase token (Android). */
export interface OwnedPurchase {
  productId: string;
  token: string;
  platform: StorePlatform;
}

export type PurchaseOutcome =
  | { status: "success"; purchase: OwnedPurchase }
  | { status: "cancelled" }
  | { status: "pending" };

export interface PurchasesApi {
  /** false on web / when the native module is missing (e.g. Expo Go) */
  available: boolean;
  loading: boolean;
  loadFailed: boolean;
  products: Record<string, StoreProduct>;
  load: () => Promise<void>;
  /** Buys `productId`, tagging it with the order id so the server can tie payment to order. */
  purchase: (productId: string, orderId: string) => Promise<PurchaseOutcome>;
  /** Currently owned subscriptions (also used for Restore Purchases). */
  owned: () => Promise<OwnedPurchase[]>;
  /** Acknowledge/finish a purchase the server has verified. */
  finish: (token: string) => Promise<void>;
}
