// Web / unsupported-platform stub. The real implementation is purchases.native.tsx.
import React, { createContext, useContext } from "react";
import type { PurchasesApi } from "./purchases.types";

export type { PurchasesApi } from "./purchases.types";

const unavailable: PurchasesApi = {
  available: false,
  loading: false,
  loadFailed: false,
  products: {},
  load: async () => {},
  purchase: async () => { throw new Error("Purchases are only available in the iOS and Android apps."); },
  owned: async () => [],
  finish: async () => {},
};

const Ctx = createContext<PurchasesApi>(unavailable);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={unavailable}>{children}</Ctx.Provider>;
}

export const usePurchases = () => useContext(Ctx);
