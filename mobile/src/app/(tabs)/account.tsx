import React, { useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from "@/lib/config";
import { useMe } from "@/lib/me";
import { pendingPurchase } from "@/lib/pending";
import { usePurchases } from "@/lib/purchases";
import { syncPurchases } from "@/lib/sync";
import { colors } from "@/lib/theme";
import { Badge, Button, Card, Eyebrow, H2, Muted, Screen, Wordmark } from "@/components/ui";

const dateText = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";

function LinkRow({ title, onPress, last = false }: { title: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={{ flexDirection: "row", justifyContent: "space-between", padding: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Text style={{ color: "#fff", fontSize: 16 }}>{title}</Text>
      <Text style={{ color: colors.textFaint }}>{"›"}</Text>
    </Pressable>
  );
}

export default function AccountTab() {
  const router = useRouter();
  const { email, signOut } = useAuth();
  const { entitlement: ent, refresh, me } = useMe();
  const purchases = usePurchases();
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const store = Platform.OS === "ios" ? "App Store" : "Google Play";
  const manageUrl = Platform.OS === "ios"
    ? "https://apps.apple.com/account/subscriptions"
    : "https://play.google.com/store/account/subscriptions?package=net.swipephotos.app";
  const nativeSource = ent.source === "apple" || ent.source === "google";

  async function restore() {
    setRestoring(true);
    try {
      await purchases.load();
      const result = await syncPurchases(purchases);
      await refresh();
      Alert.alert(result?.entitlement.active ? "Subscription restored" : "Nothing to restore",
        result?.entitlement.active ? "Your subscription has been restored." : `No active subscription was found for this ${store} account.`);
    } catch {
      Alert.alert("Couldn’t restore", "Purchases couldn’t be restored. Please try again.");
    } finally { setRestoring(false); }
  }

  function confirmDelete() {
    const note = nativeSource ? `\n\nYour ${store} subscription is NOT cancelled by this — cancel it in your ${store} account settings.` : "";
    Alert.alert(
      "Delete your account?",
      `This permanently deletes your account, uploaded photos and all generated photos — also on swipephotos.net. This can’t be undone.${note}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything", style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await api.post("/api/account/delete", {}, 120_000);
              await pendingPurchase.clear();
              await signOut();
            } catch (e) {
              Alert.alert("Couldn’t delete", e instanceof ApiError ? e.message : `Please contact ${SUPPORT_EMAIL}.`);
            } finally { setDeleting(false); }
          },
        },
      ],
    );
  }

  return (
    <Screen padded={false} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Wordmark />

        <Card style={{ gap: 4 }}>
          <Eyebrow>Signed in as</Eyebrow>
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>{email ?? me?.email ?? ""}</Text>
        </Card>

        <Card style={{ gap: 12 }}>
          <Eyebrow>Subscription</Eyebrow>
          {ent.active ? (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <H2 style={{ fontSize: 18 }}>{ent.planName} {"·"} {ent.interval === "year" ? "yearly" : "monthly"}</H2>
                <Badge text={ent.willRenew ? "Active" : "Ends soon"} tint={ent.willRenew ? colors.green : colors.amber} />
              </View>
              {ent.periodEnd ? (
                <Muted style={{ fontSize: 14 }}>{ent.willRenew ? "Renews on" : "Access until"} {dateText(ent.periodEnd)}</Muted>
              ) : null}
              {nativeSource ? (
                <Button title="Manage subscription" variant="secondary" onPress={() => Linking.openURL(manageUrl)} />
              ) : (
                <Muted>This subscription is billed outside the {store}.</Muted>
              )}
            </>
          ) : (
            <>
              <H2 style={{ fontSize: 18 }}>No active plan</H2>
              <Muted style={{ fontSize: 14 }}>Start with a free preview, then choose a plan.</Muted>
              <Button title="Get started" onPress={() => router.push("/onboarding")} />
            </>
          )}
          <Pressable onPress={restore} disabled={restoring}>
            <Text style={{ color: colors.blue400, fontWeight: "600", fontSize: 14 }}>{restoring ? "Restoring…" : "Restore Purchases"}</Text>
          </Pressable>
        </Card>

        {ent.active ? (
          <Card style={{ gap: 10 }}>
            <Eyebrow>This month</Eyebrow>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              {ent.canStartSet ? 0 : ent.photoQuota} / {ent.photoQuota} photos used
            </Text>
            <Muted>
              {ent.canStartSet ? "Your set for this month hasn’t been created yet." : ent.nextSetAvailableAt ? `Next set available on ${dateText(ent.nextSetAvailableAt)}.` : ""}
            </Muted>
          </Card>
        ) : null}

        <Card padding={0}>
          <LinkRow title="Terms of Use" onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)} />
          <LinkRow title="Privacy Policy" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)} />
          <LinkRow title="Contact support" last onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        </Card>

        <View style={{ gap: 10 }}>
          <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
          <Button title="Delete account" variant="destructive" loading={deleting} onPress={confirmDelete} />
        </View>

        <Muted style={{ textAlign: "center" }}>SwipePhotos {Constants.expoConfig?.version ?? ""}</Muted>
      </ScrollView>
    </Screen>
  );
}
