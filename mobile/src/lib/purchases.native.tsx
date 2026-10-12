import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from "expo-iap";
import { ALL_PRODUCT_IDS } from "./config";
import type { OwnedPurchase, PurchaseOutcome, PurchasesApi, StoreProduct } from "./purchases.types";

export type { PurchasesApi } from "./purchases.types";

const Ctx = createContext<PurchasesApi | null>(null);
const platform = Platform.OS === "ios" ? "ios" : "android";

const asOwned = (p: Purchase): OwnedPurchase | null =>
  p.purchaseToken ? { productId: p.productId, token: p.purchaseToken, platform } : null;

interface Pending {
  productId: string;
  resolve: (outcome: PurchaseOutcome) => void;
  reject: (error: Error) => void;
}

/** StoreKit 2 (iOS) and Play Billing (Android) through expo-iap. */
export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Record<string, StoreProduct>>({});
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const connected = useRef(false);
  const pending = useRef<Pending | null>(null);
  const purchaseObjects = useRef<Map<string, Purchase>>(new Map());

  // Purchase results arrive through listeners, not as return values.
  useEffect(() => {
    const updated = purchaseUpdatedListener((purchase: Purchase) => {
      const waiting = pending.current;
      if (!waiting || purchase.productId !== waiting.productId) return;
      if (purchase.purchaseState === "pending") {
        pending.current = null;
        waiting.resolve({ status: "pending" });
        return;
      }
      const owned = asOwned(purchase);
      if (!owned) return;
      purchaseObjects.current.set(owned.token, purchase);
      pending.current = null;
      waiting.resolve({ status: "success", purchase: owned });
    });
    const failed = purchaseErrorListener((error) => {
      const waiting = pending.current;
      if (!waiting) return;
      pending.current = null;
      if (error.code === ErrorCode.UserCancelled) waiting.resolve({ status: "cancelled" });
      else waiting.reject(new Error(error.message || "The purchase didn’t go through."));
    });
    return () => { updated.remove(); failed.remove(); };
  }, []);

  const connect = useCallback(async () => {
    if (connected.current) return;
    connected.current = (await initConnection()) === true;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await connect();
      const fetched = await fetchProducts({ skus: ALL_PRODUCT_IDS, type: "subs" });
      const map: Record<string, StoreProduct> = {};
      for (const item of (fetched ?? []) as any[]) {
        const offers = (item.subscriptionOffers ?? []) as { offerTokenAndroid?: string }[];
        map[item.id] = {
          id: item.id,
          displayPrice: item.displayPrice,
          price: item.price,
          currency: item.currency,
          offerToken: offers.find((o) => o.offerTokenAndroid)?.offerTokenAndroid,
        };
      }
      setProducts(map);
      setLoadFailed(Object.keys(map).length === 0);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [connect]);

  const purchase = useCallback(async (productId: string, orderId: string): Promise<PurchaseOutcome> => {
    await connect();
    if (pending.current) throw new Error("Another purchase is already in progress.");
    const product = products[productId];
    const outcome = new Promise<PurchaseOutcome>((resolve, reject) => {
      pending.current = { productId, resolve, reject };
    });
    try {
      await requestPurchase({
        type: "subs",
        request: {
          apple: { sku: productId, appAccountToken: orderId },
          google: {
            skus: [productId],
            obfuscatedAccountId: orderId,
            subscriptionOffers: product?.offerToken ? [{ sku: productId, offerToken: product.offerToken }] : undefined,
          },
        },
      });
    } catch (e) {
      pending.current = null;
      throw e;
    }
    return outcome;
  }, [connect, products]);

  const owned = useCallback(async (): Promise<OwnedPurchase[]> => {
    await connect();
    const list = await getAvailablePurchases();
    const out: OwnedPurchase[] = [];
    for (const item of list ?? []) {
      const o = asOwned(item);
      if (o) { out.push(o); purchaseObjects.current.set(o.token, item); }
    }
    return out;
  }, [connect]);

  const finish = useCallback(async (token: string) => {
    let purchaseObject = purchaseObjects.current.get(token);
    if (!purchaseObject) {
      await owned();
      purchaseObject = purchaseObjects.current.get(token);
    }
    if (purchaseObject) await finishTransaction({ purchase: purchaseObject, isConsumable: false });
  }, [owned]);

  const value = useMemo<PurchasesApi>(
    () => ({ available: true, loading, loadFailed, products, load, purchase, owned, finish }),
    [loading, loadFailed, products, load, purchase, owned, finish],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePurchases(): PurchasesApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePurchases must be used inside PurchasesProvider");
  return ctx;
}
