import React from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMe } from "@/lib/me";
import { colors } from "@/lib/theme";
import { isInProgress, Order } from "@/lib/types";
import { Badge, Body, Button, Card, ErrorBanner, Eyebrow, H2, Muted, Photo, Screen, Wordmark } from "@/components/ui";

const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const ready = order.status === "ready";
  const failed = order.status === "failed";
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card padding={14} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ width: 64, height: 80, borderRadius: 12, overflow: "hidden", backgroundColor: colors.fill, alignItems: "center", justifyContent: "center" }}>
          {order.photos[0] ? <Photo uri={order.photos[0]} style={{ width: 64, height: 80 }} /> : <Text style={{ fontSize: 22 }}>{failed ? "⚠️" : "⏳"}</Text>}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>{order.planName} set</Text>
          <Muted>{date(order.createdAt)}</Muted>
          <Badge
            text={ready ? `${order.photos.length} photos` : failed ? "Needs attention" : "Creating your photos"}
            tint={ready ? colors.green : failed ? colors.amber : colors.blue500}
          />
        </View>
        <Text style={{ color: colors.textFaint, fontSize: 20 }}>{"›"}</Text>
      </Card>
    </Pressable>
  );
}

export default function PhotosTab() {
  const router = useRouter();
  const { entitlement, orders, loading, error, me, refresh } = useMe();

  return (
    <Screen padded={false} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.textMuted} />}
        showsVerticalScrollIndicator={false}
      >
        <Wordmark />

        {entitlement.active && entitlement.canStartSet ? (
          <Card style={{ gap: 12 }}>
            <Badge text={`${entitlement.planName ?? "Your"} plan`} tint={colors.green} />
            <H2>Your photo set is ready to create</H2>
            <Body style={{ color: colors.textSecondary, fontSize: 14 }}>
              Your subscription includes {entitlement.photoQuota} new photos this month.
            </Body>
            <Button title="Create new photos" onPress={() => router.push("/onboarding")} />
          </Card>
        ) : entitlement.active ? (
          <Card style={{ gap: 6 }}>
            <Badge text={`${entitlement.planName ?? "Your"} plan`} tint={colors.green} />
            <H2 style={{ fontSize: 18 }}>This month{"’"}s set is done</H2>
            <Body style={{ color: colors.textSecondary, fontSize: 14 }}>
              {entitlement.nextSetAvailableAt ? `Your next set is available on ${date(entitlement.nextSetAvailableAt)}.` : "Your next set is available soon."}
            </Body>
          </Card>
        ) : me ? (
          <Card style={{ gap: 12 }}>
            <H2>Get more photos</H2>
            <Body style={{ color: colors.textSecondary, fontSize: 14 }}>Start with a free preview, then pick a plan.</Body>
            <Button title={"Generate your photos →"} onPress={() => router.push("/onboarding")} />
          </Card>
        ) : null}

        {error && !me ? <ErrorBanner message={error} /> : null}

        {orders.length === 0 ? (
          me ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
              <Text style={{ fontSize: 40 }}>{"🖼️"}</Text>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>No photos yet</Text>
              <Muted>Your finished photo sets will appear here.</Muted>
            </View>
          ) : null
        ) : (
          <View style={{ gap: 12 }}>
            <Eyebrow>Your photo sets</Eyebrow>
            {orders.map((o) => (
              <OrderRow key={o.id} order={o} onPress={() => router.push(`/order/${o.id}`)} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
