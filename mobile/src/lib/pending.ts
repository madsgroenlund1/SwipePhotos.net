import { storage } from "./storage";
import { orders } from "./orders";
import { ApiError } from "./api";
import type { PurchasesApi } from "./purchases.types";

const KEY = "sw_pending_purchase";

/** A purchase that was paid but not yet redeemed with our server. Persisted so a crash/offline moment can't cost the customer their photos. */
export interface PendingPurchase {
  orderId: string;
  productId: string;
  token?: string;
}

export const pendingPurchase = {
  async load(): Promise<PendingPurchase | null> {
    const raw = await storage.get(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as PendingPurchase; } catch { return null; }
  },
  save: (p: PendingPurchase) => storage.set(KEY, JSON.stringify(p)),
  clear: () => storage.remove(KEY),
};

/** Redeems a stored pending purchase. Returns true when something was redeemed. */
export async function redeemPending(purchases: PurchasesApi): Promise<boolean> {
  const pending = await pendingPurchase.load();
  if (!pending) return false;

  let token = pending.token;
  if (!token) {
    const owned = await purchases.owned().catch(() => []);
    token = owned.find((o) => o.productId === pending.productId)?.token;
    if (token) await pendingPurchase.save({ ...pending, token });
  }
  if (!token) return false;

  try {
    await orders.redeem(pending.orderId, { productId: pending.productId, token });
    await pendingPurchase.clear();
    await purchases.finish(token).catch(() => {});
    return true;
  } catch (e) {
    // The order is gone or can never be redeemed: stop retrying. Network errors: retry next time.
    if (e instanceof ApiError && [400, 404, 409].includes(e.status)) await pendingPurchase.clear();
    return false;
  }
}
