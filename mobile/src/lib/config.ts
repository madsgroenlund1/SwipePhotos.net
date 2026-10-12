import Constants from "expo-constants";

/** Backend. The bare domain redirects to www, so call www directly. */
export const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "https://www.swipephotos.net";

/** Public website: marketing images and the legal pages always come from here, whatever API_URL is. */
export const SITE_URL = "https://www.swipephotos.net";

export const SUPPORT_EMAIL = "support@swipephotos.net";
export const TERMS_URL = `${SITE_URL}/terms`;
export const PRIVACY_URL = `${SITE_URL}/privacy`;

// ─── Styles (preview scenes) ──────────────────────────────────────────────────
export type PhotoStyle = "restaurant" | "formal" | "rooftop" | "beach";
export const STYLES: { id: PhotoStyle; title: string }[] = [
  { id: "restaurant", title: "Italian Restaurant" },
  { id: "formal", title: "Smart Formal" },
  { id: "rooftop", title: "Rooftop Pool" },
  { id: "beach", title: "Beach Club" },
];
export const sceneImage = (style: PhotoStyle) => `${SITE_URL}/photos/presets/scene-${style}.jpg`;

// ─── Plans (store product ids must match App Store Connect / Play Console) ────
export type PlanId = "starter" | "premium" | "pro";
export type Billing = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  /** id the server / Stripe use */
  apiId: "starter" | "popular" | "elite";
  name: string;
  photos: number;
  popular: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  { id: "starter", apiId: "starter", name: "Starter", photos: 5, popular: false,
    features: ["5 AI photos / month", "2 style presets", "~60 min delivery"] },
  { id: "premium", apiId: "popular", name: "Premium", photos: 15, popular: true,
    features: ["15 AI photos / month", "All 40 templates", "~30 min priority delivery"] },
  { id: "pro", apiId: "elite", name: "Pro", photos: 45, popular: false,
    features: ["45 AI photos / month", "All 40 templates", "~30 min priority delivery"] },
];

export const productId = (plan: PlanId, billing: Billing) => `net.swipephotos.app.${plan}.${billing}`;
export const ALL_PRODUCT_IDS = PLANS.flatMap((p) => (["monthly", "yearly"] as Billing[]).map((b) => productId(p.id, b)));
export const planFromApiId = (apiId?: string | null) => PLANS.find((p) => p.apiId === apiId);

// ─── Photo slots ──────────────────────────────────────────────────────────────
export type PhotoSlot = "body" | "left" | "front" | "right" | "tattoo";
export const SLOT_INFO: Record<PhotoSlot, { title: string; hint: string; example: string }> = {
  body: { title: "Full body", hint: "Head to fingertips", example: "body.jpg" },
  left: { title: "Left angle", hint: "Turn your head slightly left", example: "left-v2.jpg" },
  front: { title: "Front", hint: "Face the camera directly", example: "front.jpg" },
  right: { title: "Right angle", hint: "Turn your head slightly right", example: "right-v2.jpg" },
  tattoo: { title: "Tattoo", hint: "A clear photo of your tattoo", example: "tattoo-example.jpg" },
};
export const exampleImage = (slot: PhotoSlot) => `${SITE_URL}/photos/upload-examples/${SLOT_INFO[slot].example}`;
/** Order the generator expects (front first; tattoo last). */
export const UPLOAD_ORDER: PhotoSlot[] = ["front", "left", "right", "body", "tattoo"];
