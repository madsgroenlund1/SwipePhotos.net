import { Platform } from "react-native";
import { api } from "./api";
import type { PurchasesApi } from "./purchases.types";
import type { Entitlement } from "./types";

/** Sends the store's current subscriptions to the server (restore / renewals). */
export async function syncPurchases(purchases: PurchasesApi): Promise<{ entitlement: Entitlement; restored: boolean } | null> {
  if (!purchases.available) return null;
  const owned = await purchases.owned().catch(() => []);
  if (owned.length === 0) return null;
  const body =
    Platform.OS === "ios"
      ? { signedTransactions: owned.map((o) => o.token) }
      : { playPurchases: owned.map((o) => ({ productId: o.productId, purchaseToken: o.token })) };
  try {
    return await api.post<{ entitlement: Entitlement; restored: boolean }>("/api/mobile/iap/sync", body);
  } catch {
    return null;
  }
}
