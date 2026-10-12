import React, { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { MeProvider, useMe } from "@/lib/me";
import { PurchasesProvider, usePurchases } from "@/lib/purchases";
import { redeemPending } from "@/lib/pending";
import { syncPurchases } from "@/lib/sync";
import { colors } from "@/lib/theme";

/** Keeps account data fresh: on launch, sign-in and whenever the app returns to the foreground. */
function Boot() {
  const { ready, signedIn } = useAuth();
  const { refresh } = useMe();
  const purchases = usePurchases();

  const update = useCallback(async () => {
    if (!signedIn) return;
    await redeemPending(purchases);
    await syncPurchases(purchases);
    await refresh();
  }, [signedIn, purchases, refresh]);

  useEffect(() => { void purchases.load(); }, [purchases.available]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ready && signedIn) void update();
  }, [ready, signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => { if (state === "active") void update(); });
    return () => sub.remove();
  }, [update]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MeProvider>
          <PurchasesProvider>
            <Boot />
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
              <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
              <Stack.Screen name="order/[id]" options={{ headerShown: true, title: "Your photos", headerBackTitle: "Photos" }} />
              <Stack.Screen name="viewer" options={{ presentation: "fullScreenModal" }} />
            </Stack>
          </PurchasesProvider>
        </MeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
