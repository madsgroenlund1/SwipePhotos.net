export interface Entitlement {
  active: boolean;
  source: "apple" | "google" | "stripe" | null;
  planId: string | null;
  planName: string | null;
  photoQuota: number;
  interval: "month" | "year" | null;
  periodStart: string | null;
  periodEnd: string | null;
  willRenew: boolean;
  canStartSet: boolean;
  nextSetAvailableAt: string | null;
}

export const NO_ENTITLEMENT: Entitlement = {
  active: false, source: null, planId: null, planName: null, photoQuota: 0, interval: null,
  periodStart: null, periodEnd: null, willRenew: false, canStartSet: false, nextSetAvailableAt: null,
};

export type OrderStatus = "pending" | "processing" | "generating" | "training" | "draft" | "ready" | "failed";

export interface Order {
  id: string;
  packageType: string;
  planName: string;
  status: OrderStatus;
  createdAt: string;
  photos: string[];
}

export const isInProgress = (s: OrderStatus) => s !== "ready" && s !== "failed";

export interface Me {
  email: string;
  entitlement: Entitlement;
  orders: Order[];
  token?: string | null;
}

export interface OrderStatusResponse {
  id: string;
  status: OrderStatus;
  planName: string;
  photos: string[];
}

export interface PickedPhoto {
  /** local file uri of the compressed JPEG (or object URL on web) */
  uri: string;
  bytes: number;
}

/** One line of the server's NDJSON progress streams. */
export interface StreamEvent {
  status: string;
  urls?: string[];
  url?: string;
  error?: string;
}
