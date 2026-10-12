import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { ApiError } from "@/lib/api";
import { orders } from "@/lib/orders";
import { isInProgress, OrderStatusResponse } from "@/lib/types";
import { colors } from "@/lib/theme";
import { Body, H2, Muted } from "./ui";

const MESSAGES = [
  "Matching your face and features…",
  "Placing you in the scene…",
  "Checking every photo for quality…",
  "Polishing skin tone and lighting…",
  "Almost there…",
];

/**
 * Polls an order until it leaves the "in progress" states. Each poll also advances
 * the server-side pipeline, so keeping this screen open is enough.
 */
export function OrderProgress({ orderId, onFinished }: { orderId: string; onFinished: (s: OrderStatusResponse) => void }) {
  const [tick, setTick] = useState(0);
  const finished = useRef(onFinished);
  finished.current = onFinished;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        try {
          const status = await orders.status(orderId);
          if (cancelled) return;
          if (!isInProgress(status.status)) { finished.current(status); return; }
        } catch (e) {
          if (e instanceof ApiError && (e.status === 401 || e.status === 404)) return;
          // transient network problem: keep polling
        }
        setTick((t) => t + 1);
        await new Promise((r) => setTimeout(r, 8000));
      }
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <View style={{ alignItems: "center", gap: 18, paddingVertical: 24 }}>
      <ActivityIndicator size="large" color={colors.blue500} />
      <H2 style={{ fontSize: 24 }}>Creating your photos</H2>
      <Body style={{ color: colors.blue400 }}>{MESSAGES[tick % MESSAGES.length]}</Body>
      <Muted style={{ textAlign: "center", paddingHorizontal: 24 }}>
        This usually takes 30{"–"}60 minutes. You can close the app {"—"} we{"’"}ll e-mail you when your photos are ready.
      </Muted>
    </View>
  );
}
