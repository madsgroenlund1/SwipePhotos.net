import { Platform } from "react-native";
import { api } from "./api";
import { appendPhoto } from "./images";
import { PhotoSlot, PhotoStyle, PlanId, PLANS, UPLOAD_ORDER } from "./config";
import type { OrderStatusResponse, PickedPhoto } from "./types";

/** Server calls for creating, filling and redeeming an order. */
export const orders = {
  /** mode: "purchase" (will be paid in the store) or "subscription" (an active plan covers it). */
  async create(opts: {
    plan: PlanId; style: PhotoStyle; hasTattoos: boolean; previewUrl?: string | null; mode: "purchase" | "subscription";
  }): Promise<string> {
    const plan = PLANS.find((p) => p.id === opts.plan)!;
    const res = await api.post<{ orderId: string }>("/api/mobile/orders", {
      packageId: plan.apiId,
      style: opts.style,
      hasTattoos: opts.hasTattoos,
      mode: opts.mode,
      ...(opts.previewUrl ? { selectedPreviewUrl: opts.previewUrl } : {}),
    });
    return res.orderId;
  },

  async upload(orderId: string, photos: Partial<Record<PhotoSlot, PickedPhoto>>): Promise<void> {
    const form = new FormData();
    for (const slot of UPLOAD_ORDER) {
      const photo = photos[slot];
      if (!photo) continue;
      // The generator finds the tattoo reference by this exact name.
      await appendPhoto(form, "files", photo, slot === "tattoo" ? "tattoo-reference.jpg" : `${slot}.jpg`);
    }
    await api.postForm<{ ok: boolean }>(`/api/mobile/orders/${orderId}/photos`, form);
  },

  /** Hands the verified store purchase to the server, which unlocks the order. */
  async redeem(orderId: string, purchase: { productId: string; token: string }): Promise<void> {
    if (Platform.OS === "ios") {
      await api.post(`/api/mobile/orders/${orderId}/iap`, { signedTransaction: purchase.token }, 150_000);
    } else {
      await api.post(`/api/mobile/orders/${orderId}/play`, { productId: purchase.productId, purchaseToken: purchase.token }, 150_000);
    }
  },

  async startWithSubscription(orderId: string): Promise<void> {
    await api.post(`/api/mobile/orders/${orderId}/start`, {}, 150_000);
  },

  status: (orderId: string) => api.get<OrderStatusResponse>(`/api/mobile/orders/${orderId}`),
};
