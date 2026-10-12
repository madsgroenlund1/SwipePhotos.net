import React, { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Billing, PLANS, productId } from "@/lib/config";
import { useFlow } from "@/lib/flow";
import { useMe } from "@/lib/me";
import { PRIVACY_URL, TERMS_URL } from "@/lib/config";
import { usePurchases } from "@/lib/purchases";
import { syncPurchases } from "@/lib/sync";
import { colors } from "@/lib/theme";
import { Badge, Button, Card, ErrorBanner, H2, Muted, NoticeBanner, Photo, Row } from "../ui";
import { StepLayout } from "./StepLayout";

const dateText = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";

/**
 * Plan picker + purchase. Shows price and period, the auto-renewal terms,
 * Terms/Privacy links and Restore Purchases (App Store guideline 3.1.2).
 */
export function Paywall() {
  const flow = useFlow();
  const router = useRouter();
  const { signedIn } = useAuth();
  const { entitlement, refresh } = useMe();
  const purchases = usePurchases();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (purchases.available && Object.keys(purchases.products).length === 0 && !purchases.loading) void purchases.load();
    if (signedIn) void refresh();
  }, [signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const covered = signedIn && entitlement.active && entitlement.canStartSet;
  const usedUp = signedIn && entitlement.active && !entitlement.canStartSet;
  const store = Platform.OS === "ios" ? "App Store" : "Google Play";

  async function onContinue() {
    setError(null);
    setNotice(null);
    if (!signedIn) { router.push("/sign-in"); return; }
    try {
      const outcome = await flow.checkout({ entitlement, purchases });
      if (outcome === "started") await refresh();
      if (outcome === "awaiting-approval") {
        setNotice("Your purchase is waiting for approval (for example Ask to Buy). We’ll start your photos as soon as it’s approved — you can close this screen.");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  async function restore() {
    setRestoring(true);
    setError(null);
    try {
      if (!signedIn) { setNotice("Sign in to restore your subscription."); router.push("/sign-in"); return; }
      await syncPurchases(purchases);
      await refresh();
    } catch {
      setError("Purchases couldn’t be restored. Please try again.");
    } finally { setRestoring(false); }
  }

  const selectedProduct = purchases.products[productId(flow.plan, flow.billing)];
  const canBuy = !!selectedProduct && purchases.available;

  return (
    <StepLayout
      title="Your matches are waiting"
      footer={
        usedUp ? (
          <Button title="Close" variant="secondary" onPress={() => router.back()} />
        ) : (
          <>
            <Button
              title={covered ? "Create my photos" : signedIn ? "Subscribe" : "Continue"}
              loading={flow.working}
              disabled={!covered && signedIn && !canBuy}
              onPress={() => void onContinue()}
            />
            {!signedIn ? <Muted style={{ textAlign: "center" }}>You{"’"}ll create your account in the next step.</Muted> : null}
          </>
        )
      }
    >
      <Row style={{ gap: 14 }}>
        <Photo uri={flow.displayUrl} style={{ width: 84, height: 112, borderRadius: 14 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Badge text="Your preview is ready" tint={colors.green} />
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Unlock your full set of photos in your chosen style.</Text>
        </View>
      </Row>

      {covered ? (
        <Card style={{ gap: 8 }}>
          <H2 style={{ fontSize: 18 }}>Included in your {entitlement.planName} plan</H2>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>This month{"’"}s photo set is part of your subscription {"—"} nothing more to pay.</Text>
        </Card>
      ) : usedUp ? (
        <Card style={{ gap: 8 }}>
          <H2 style={{ fontSize: 18 }}>You{"’"}ve used this month{"’"}s set</H2>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            {entitlement.nextSetAvailableAt ? `Your next photo set is available on ${dateText(entitlement.nextSetAvailableAt)}.` : "Your next photo set is available soon."}
          </Text>
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: "row", padding: 4, borderRadius: 16, backgroundColor: colors.fill, borderWidth: 1, borderColor: colors.border }}>
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <Pressable
                key={b}
                accessibilityRole="button"
                accessibilityState={{ selected: flow.billing === b }}
                onPress={() => flow.setBilling(b)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, backgroundColor: flow.billing === b ? "rgba(255,255,255,0.12)" : "transparent" }}
              >
                <Text style={{ color: flow.billing === b ? "#fff" : colors.textSecondary, fontWeight: "600", fontSize: 15 }}>
                  {b === "monthly" ? "Monthly" : "Yearly"}
                </Text>
                {b === "yearly" ? <Badge text="50% OFF" tint={colors.green} /> : null}
              </Pressable>
            ))}
          </View>

          {PLANS.map((plan) => {
            const selected = flow.plan === plan.id;
            const product = purchases.products[productId(plan.id, flow.billing)];
            return (
              <Pressable
                key={plan.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => flow.setPlan(plan.id)}
                style={{
                  flexDirection: "row", gap: 14, padding: 16, borderRadius: 20,
                  backgroundColor: selected ? "rgba(37,99,235,0.10)" : colors.card,
                  borderWidth: selected ? 2 : 1, borderColor: selected ? colors.blue500 : colors.border,
                }}
              >
                <Text style={{ fontSize: 20, color: selected ? colors.blue500 : colors.textFaint }}>{selected ? "◉" : "○"}</Text>
                <View style={{ flex: 1, gap: 8 }}>
                  <Row style={{ gap: 8 }}>
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{plan.name}</Text>
                    {plan.popular ? <Badge text="Most popular" /> : null}
                  </Row>
                  {plan.features.map((f) => (
                    <Text key={f} style={{ color: colors.textSecondary, fontSize: 13 }}>{"✓  "}{f}</Text>
                  ))}
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  {product ? (
                    <>
                      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{product.displayPrice}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{flow.billing === "monthly" ? "per month" : "per year"}</Text>
                      {flow.billing === "yearly" && product.price && product.currency ? (
                        <Text style={{ color: colors.green, fontSize: 12, fontWeight: "600" }}>
                          {new Intl.NumberFormat(undefined, { style: "currency", currency: product.currency }).format(product.price / 12)}/mo
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{"…"}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}

          {!purchases.available ? (
            <NoticeBanner message="Subscriptions can be bought in the iOS and Android apps." />
          ) : purchases.loadFailed ? (
            <View style={{ gap: 10 }}>
              <Muted>We couldn{"’"}t load the plans from the {store}.</Muted>
              <Button title="Try again" variant="secondary" onPress={() => void purchases.load()} />
            </View>
          ) : null}
        </>
      )}

      {notice ? <NoticeBanner message={notice} /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!covered && !usedUp ? (
        <View style={{ gap: 12 }}>
          <Muted style={{ lineHeight: 18 }}>
            Payment is charged to your {Platform.OS === "ios" ? "Apple ID" : "Google Play account"} at confirmation of purchase. The subscription renews automatically at the price shown unless it is cancelled at least 24 hours before the end of the current period. You can manage or cancel it anytime in your {store} account settings.
          </Muted>
          <Muted style={{ lineHeight: 18 }}>
            AI-generated photos can{"’"}t be guaranteed to be 100% perfect. If one isn{"’"}t right, contact support and we{"’"}ll regenerate it free of charge.
          </Muted>
          <Row style={{ gap: 18, flexWrap: "wrap" }}>
            <Pressable onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}><Text style={{ color: colors.blue400, fontWeight: "600", fontSize: 13 }}>Terms of Use</Text></Pressable>
            <Pressable onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}><Text style={{ color: colors.blue400, fontWeight: "600", fontSize: 13 }}>Privacy Policy</Text></Pressable>
            <Pressable disabled={restoring} onPress={() => void restore()}>
              <Text style={{ color: colors.blue400, fontWeight: "600", fontSize: 13 }}>{restoring ? "Restoring…" : "Restore Purchases"}</Text>
            </Pressable>
          </Row>
        </View>
      ) : null}
    </StepLayout>
  );
}
