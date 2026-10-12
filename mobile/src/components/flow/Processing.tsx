import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFlow } from "@/lib/flow";
import { useMe } from "@/lib/me";
import { colors } from "@/lib/theme";
import type { OrderStatusResponse } from "@/lib/types";
import { OrderProgress } from "../OrderProgress";
import { Body, Button, H1 } from "../ui";

/** Last step: the order is paid and generating. */
export function ProcessingStep() {
  const flow = useFlow();
  const router = useRouter();
  const { refresh } = useMe();
  const [finished, setFinished] = useState<OrderStatusResponse | null>(null);

  const ready = finished?.status === "ready";

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
        {finished ? (
          <>
            <Text style={{ fontSize: 60 }}>{ready ? "✅" : "⚠️"}</Text>
            <H1 style={{ textAlign: "center" }}>{ready ? "Your photos are ready!" : "Something went wrong"}</H1>
            <Body style={{ color: colors.textSecondary, textAlign: "center" }}>
              {ready ? `${finished.photos.length} photos are waiting for you.` : "Please contact support and we’ll make it right."}
            </Body>
          </>
        ) : flow.processingOrderId ? (
          <OrderProgress
            orderId={flow.processingOrderId}
            onFinished={(s) => { setFinished(s); void refresh(); }}
          />
        ) : null}
      </View>
      <View style={{ paddingBottom: 12 }}>
        <Button title={ready ? "View my photos" : "Done"} onPress={() => router.replace("/photos")} />
      </View>
    </View>
  );
}
