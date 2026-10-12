import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ApiError, streamNdjson } from "./api";
import { PhotoSlot, PhotoStyle, Plan, PlanId, PLANS, Billing, productId as makeProductId } from "./config";
import { appendPhoto, flipPhoto, MIN_BYTES, preparePhoto } from "./images";
import { orders } from "./orders";
import { pendingPurchase } from "./pending";
import type { PurchasesApi } from "./purchases.types";
import type { Entitlement, PickedPhoto, StreamEvent } from "./types";

export type Step = "style" | "consent" | "photos" | "generating" | "pick" | "refining" | "paywall" | "processing";
export const PREVIEW_LABELS = ["Bad Boy", "Gentleman"];
export type CheckoutOutcome = "started" | "cancelled" | "awaiting-approval";

interface FlowValue {
  step: Step;
  setStep: (s: Step) => void;
  style: PhotoStyle;
  setStyle: (s: PhotoStyle) => void;
  hasTattoos: boolean;
  setHasTattoos: (v: boolean) => void;
  photos: Partial<Record<PhotoSlot, PickedPhoto>>;
  setPhoto: (slot: PhotoSlot, asset: { uri: string; width: number; height: number }) => Promise<void>;
  mirrorPhoto: (slot: PhotoSlot) => Promise<void>;
  requiredSlots: PhotoSlot[];
  photosComplete: boolean;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  adult: boolean;
  setAdult: (v: boolean) => void;
  plan: PlanId;
  setPlan: (p: PlanId) => void;
  billing: Billing;
  setBilling: (b: Billing) => void;
  previewUrls: string[];
  pickedIndex: number;
  setPickedIndex: (i: number) => void;
  displayUrl: string | null;
  progress: number;
  statusText: string;
  error: string | null;
  setError: (e: string | null) => void;
  working: boolean;
  processingOrderId: string | null;
  generatePreviews: () => Promise<void>;
  refine: () => Promise<void>;
  checkout: (args: { entitlement: Entitlement; purchases: PurchasesApi }) => Promise<CheckoutOutcome>;
}

const FlowContext = createContext<FlowValue | null>(null);

/** Dev-only seed so UI work can jump straight to a later step (see onboarding.tsx). */
export interface FlowSeed { step?: Step; previewUrls?: string[] }

export function FlowProvider({ children, seed }: { children: React.ReactNode; seed?: FlowSeed }) {
  const [step, setStep] = useState<Step>(seed?.step ?? "style");
  const [style, setStyle] = useState<PhotoStyle>("restaurant");
  const [hasTattoos, setHasTattoos] = useState(false);
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlot, PickedPhoto>>>({});
  const [agreed, setAgreed] = useState(false);
  const [adult, setAdult] = useState(false);
  const [plan, setPlan] = useState<PlanId>("premium");
  const [billing, setBilling] = useState<Billing>("monthly");
  const [previewUrls, setPreviewUrls] = useState<string[]>(seed?.previewUrls ?? []);
  const [pickedIndex, setPickedIndex] = useState(0);
  const [refinedUrl, setRefinedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Lets a cancelled purchase be retried without creating/uploading again.
  const pendingOrder = useRef<{ id: string; plan: PlanId; uploaded: boolean } | null>(null);

  const requiredSlots = useMemo<PhotoSlot[]>(
    () => (hasTattoos ? ["body", "left", "front", "right", "tattoo"] : ["body", "left", "front", "right"]),
    [hasTattoos],
  );
  const photosComplete = requiredSlots.every((s) => photos[s]);
  const displayUrl = refinedUrl ?? previewUrls[pickedIndex] ?? null;

  const setPhoto = useCallback(async (slot: PhotoSlot, asset: { uri: string; width: number; height: number }) => {
    try {
      const prepared = await preparePhoto(asset);
      if (prepared.bytes < MIN_BYTES) {
        setError("That photo is too small or unclear. Please choose a sharper one.");
        return;
      }
      setError(null);
      setPhotos((current) => ({ ...current, [slot]: prepared }));
    } catch {
      setError("We couldn’t read that photo. Please try another one.");
    }
  }, []);

  const mirrorPhoto = useCallback(async (slot: PhotoSlot) => {
    const current = photos[slot];
    if (!current) return;
    try {
      const flipped = await flipPhoto(current);
      setPhotos((all) => ({ ...all, [slot]: flipped }));
    } catch {
      setError("We couldn’t flip that photo. Please try again.");
    }
  }, [photos]);

  const generatePreviews = useCallback(async () => {
    if (!photosComplete) return;
    setError(null);
    setPreviewUrls([]);
    setRefinedUrl(null);
    setStep("generating");
    setProgress(0.04);
    setStatusText("Validating photos");
    setWorking(true);

    try {
      const form = new FormData();
      for (const slot of ["front", "left", "right", "body"] as PhotoSlot[]) {
        const photo = photos[slot];
        if (photo) await appendPhoto(form, slot, photo, `${slot}.jpg`);
      }
      if (hasTattoos && photos.tattoo) {
        form.append("hasTattoos", "true");
        await appendPhoto(form, "tattooPhoto", photos.tattoo, "tattoo-reference.jpg");
      }
      form.append("style", style);

      let urls: string[] = [];
      const onEvent = (e: StreamEvent) => {
        const map: Record<string, [string, number]> = {
          uploading: ["Validating photos", 0.1],
          preparing: ["Preparing your setting", 0.2],
          gen_1: ["Generating preview 1 of 2", 0.35],
          gen_2: ["Generating preview 2 of 2", 0.65],
          checking: ["Checking quality", 0.85],
          saving: ["Saving previews", 0.95],
        };
        if (map[e.status]) { setStatusText(map[e.status][0]); setProgress(map[e.status][1]); }
        if (e.status === "done" && e.urls) { urls = e.urls; setProgress(1); }
      };
      await streamNdjson("/api/generate/preview", form, onEvent);

      if (urls.length < 2) throw new ApiError("We couldn’t finish your previews. Please try again.");
      setPreviewUrls(urls);
      setPickedIndex(0);
      setStep("pick");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setStep("photos");
    } finally {
      setWorking(false);
    }
  }, [photos, photosComplete, hasTattoos, style]);

  const refine = useCallback(async () => {
    const url = previewUrls[pickedIndex];
    if (!url) return;
    setError(null);
    setRefinedUrl(null);
    setStep("refining");
    setProgress(0.05);
    setStatusText("Preparing selected preview");
    try {
      const map: Record<string, [string, number]> = {
        preparing: ["Preparing selected preview", 0.08],
        checking_alignment: ["Checking face alignment", 0.22],
        blending: ["Improving face and neck blending", 0.38],
        skin_tone: ["Matching skin tone and lighting", 0.52],
        texture: ["Preserving natural skin texture", 0.66],
        artifacts: ["Correcting minor visual artifacts", 0.78],
        quality: ["Optimizing image quality", 0.88],
        saving: ["Saving final preview", 0.95],
      };
      await streamNdjson("/api/refine/preview", JSON.stringify({ previewUrl: url }), (e) => {
        if (map[e.status]) { setStatusText(map[e.status][0]); setProgress(map[e.status][1]); }
        if (e.status === "done") { setRefinedUrl(e.url ?? null); setStatusText("Ready"); setProgress(1); }
      }, 150_000);
    } catch {
      // The polish pass is optional: fall back to the preview the customer picked.
      setRefinedUrl(null);
    }
    setStep("paywall");
  }, [previewUrls, pickedIndex]);

  const checkout = useCallback(async ({ entitlement, purchases }: { entitlement: Entitlement; purchases: PurchasesApi }): Promise<CheckoutOutcome> => {
    setWorking(true);
    try {
      // Active subscriber with an unused set: no new payment.
      if (entitlement.active && entitlement.canStartSet) {
        const activePlan = PLANS.find((p) => p.apiId === entitlement.planId);
        if (activePlan) {
          const orderId = await orders.create({ plan: activePlan.id, style, hasTattoos, previewUrl: displayUrl, mode: "subscription" });
          await orders.upload(orderId, photos);
          await orders.startWithSubscription(orderId);
          setProcessingOrderId(orderId);
          setStep("processing");
          return "started";
        }
      }

      const sku = makeProductId(plan, billing);
      if (pendingOrder.current && pendingOrder.current.plan !== plan) pendingOrder.current = null;
      if (!pendingOrder.current) {
        const id = await orders.create({ plan, style, hasTattoos, previewUrl: displayUrl, mode: "purchase" });
        pendingOrder.current = { id, plan, uploaded: false };
      }
      const order = pendingOrder.current;
      if (!order.uploaded) {
        await orders.upload(order.id, photos);
        order.uploaded = true;
      }

      const outcome = await purchases.purchase(sku, order.id);
      if (outcome.status === "cancelled") return "cancelled";
      if (outcome.status === "pending") {
        await pendingPurchase.save({ orderId: order.id, productId: sku });
        return "awaiting-approval";
      }

      // Persist BEFORE the network call: a paid purchase must never be lost.
      const { productId, token } = outcome.purchase;
      await pendingPurchase.save({ orderId: order.id, productId, token });
      await orders.redeem(order.id, { productId, token });
      await pendingPurchase.clear();
      await purchases.finish(token).catch(() => {});
      pendingOrder.current = null;
      setProcessingOrderId(order.id);
      setStep("processing");
      return "started";
    } finally {
      setWorking(false);
    }
  }, [style, hasTattoos, displayUrl, photos, plan, billing]);

  const value = useMemo<FlowValue>(() => ({
    step, setStep, style, setStyle, hasTattoos, setHasTattoos, photos, setPhoto, mirrorPhoto, requiredSlots, photosComplete,
    agreed, setAgreed, adult, setAdult, plan, setPlan, billing, setBilling, previewUrls, pickedIndex, setPickedIndex,
    displayUrl, progress, statusText, error, setError, working, processingOrderId, generatePreviews, refine, checkout,
  }), [step, style, hasTattoos, photos, setPhoto, mirrorPhoto, requiredSlots, photosComplete, agreed, adult, plan, billing,
       previewUrls, pickedIndex, displayUrl, progress, statusText, error, working, processingOrderId,
       generatePreviews, refine, checkout]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used inside FlowProvider");
  return ctx;
}

export type { Plan };
