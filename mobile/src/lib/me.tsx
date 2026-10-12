import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "./api";
import { useAuth } from "./auth";
import { Entitlement, Me, NO_ENTITLEMENT, Order } from "./types";

interface MeValue {
  me: Me | null;
  entitlement: Entitlement;
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MeContext = createContext<MeValue | null>(null);

/** Account data (orders + subscription) for the signed-in user. */
export function MeProvider({ children }: { children: React.ReactNode }) {
  const { signedIn, rotateToken } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!signedIn) { setMe(null); return; }
    setLoading(true);
    try {
      const response = await api.get<Me>("/api/mobile/me");
      setMe(response);
      setError(null);
      if (response.token) await rotateToken(response.token);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load your account.");
    } finally {
      setLoading(false);
    }
  }, [signedIn, rotateToken]);

  useEffect(() => {
    if (!signedIn) { setMe(null); setError(null); }
  }, [signedIn]);

  const value = useMemo<MeValue>(() => ({
    me,
    entitlement: me?.entitlement ?? NO_ENTITLEMENT,
    orders: me?.orders ?? [],
    loading,
    error,
    refresh,
  }), [me, loading, error, refresh]);

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe(): MeValue {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error("useMe must be used inside MeProvider");
  return ctx;
}
