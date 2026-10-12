import React, { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMe } from "@/lib/me";
import { saveToLibrary } from "@/lib/library";
import { SUPPORT_EMAIL } from "@/lib/config";
import { isInProgress } from "@/lib/types";
import { colors } from "@/lib/theme";
import { OrderProgress } from "@/components/OrderProgress";
import { Body, Button, H2, Muted, Photo, Screen } from "@/components/ui";

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { orders, refresh } = useMe();
  const { width } = useWindowDimensions();
  const order = orders.find((o) => o.id === id);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (text: string) => { setToast(text); setTimeout(() => setToast((t) => (t === text ? null : t)), 3000); };
  const cell = (width - 16 * 2 - 8 * 2) / 3;

  async function saveAll() {
    if (!order) return;
    setSaving(true);
    try {
      const n = await saveToLibrary(order.photos);
      flash(`Saved ${n} photos to your library`);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Couldn’t save the photos.");
    } finally { setSaving(false); }
  }

  return (
    <Screen padded={false} edges={["bottom"]}>
      <Stack.Screen options={{ title: order ? `${order.planName} set` : "Your photos" }} />
      {!order ? (
        <View style={{ padding: 24 }}><Muted>Loading{"…"}</Muted></View>
      ) : isInProgress(order.status) ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <OrderProgress orderId={order.id} onFinished={() => { void refresh(); }} />
        </ScrollView>
      ) : order.status === "failed" ? (
        <View style={{ padding: 24, gap: 14, alignItems: "center" }}>
          <Text style={{ fontSize: 44 }}>{"⚠️"}</Text>
          <H2>Something went wrong</H2>
          <Body style={{ color: colors.textSecondary, textAlign: "center" }}>
            We couldn{"’"}t finish this set. Contact support and we{"’"}ll make it right.
          </Body>
          <Button
            title="Contact support"
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Order%20${order.id.slice(-8).toUpperCase()}`)}
            style={{ alignSelf: "stretch" }}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {order.photos.map((url, index) => (
              <Pressable
                key={url}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Photo ${index + 1} of ${order.photos.length}`}
                onPress={() => router.push({ pathname: "/viewer", params: { order: order.id, index: String(index) } })}
              >
                <Photo uri={url} style={{ width: cell, height: cell * 4 / 3, borderRadius: 12 }} />
              </Pressable>
            ))}
          </View>
          <Button title="Save all to Photos" onPress={saveAll} loading={saving} />
          <Muted style={{ textAlign: "center" }}>
            AI-generated photos. If one isn{"’"}t right, contact support and we{"’"}ll regenerate it free.
          </Muted>
        </ScrollView>
      )}
      {toast ? (
        <View style={{ position: "absolute", bottom: 28, alignSelf: "center", backgroundColor: "#27272A", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>{toast}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
