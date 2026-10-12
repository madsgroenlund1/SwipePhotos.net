import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlowProvider, Step, useFlow } from "@/lib/flow";
import { colors } from "@/lib/theme";
import { Screen, ProgressBar } from "@/components/ui";
import { ConsentStep, PhotosStep, StyleStep } from "@/components/flow/Setup";
import { GeneratingStep, PickStep, RefiningStep } from "@/components/flow/Preview";
import { Paywall } from "@/components/flow/Paywall";
import { ProcessingStep } from "@/components/flow/Processing";

const ORDER: Step[] = ["style", "consent", "photos", "generating", "pick", "refining", "paywall", "processing"];

function Flow() {
  const flow = useFlow();
  const router = useRouter();
  const busy = flow.step === "generating" || flow.step === "refining" || flow.working;
  const backTarget: Partial<Record<Step, Step>> = { consent: "style", photos: "consent", paywall: "pick" };
  const back = backTarget[flow.step];

  function close() {
    const hasWork = Object.keys(flow.photos).length > 0;
    if (!hasWork || flow.step === "style") { router.back(); return; }
    Alert.alert("Leave without finishing?", "Your photos and preview won’t be saved.", [
      { text: "Keep going", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: () => router.back() },
    ]);
  }

  const circle = {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  } as const;

  return (
    <Screen padded={false}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 }}>
        {back && !busy ? (
          <Pressable accessibilityLabel="Back" onPress={() => flow.setStep(back)} style={circle}>
            <Text style={{ color: "#fff", fontSize: 18 }}>{"‹"}</Text>
          </Pressable>
        ) : <View style={{ width: 36 }} />}
        <View style={{ flex: 1 }}><ProgressBar value={(ORDER.indexOf(flow.step) + 1) / ORDER.length} /></View>
        {flow.step === "processing" ? <View style={{ width: 36 }} /> : (
          <Pressable accessibilityLabel="Close" disabled={busy} onPress={close} style={[circle, busy && { opacity: 0.4 }]}>
            <Text style={{ color: "#fff", fontSize: 15 }}>{"✕"}</Text>
          </Pressable>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {flow.step === "style" && <StyleStep />}
        {flow.step === "consent" && <ConsentStep />}
        {flow.step === "photos" && <PhotosStep />}
        {flow.step === "generating" && <GeneratingStep />}
        {flow.step === "pick" && <PickStep />}
        {flow.step === "refining" && <RefiningStep />}
        {flow.step === "paywall" && <Paywall />}
        {flow.step === "processing" && <ProcessingStep />}
      </View>
    </Screen>
  );
}

export default function Onboarding() {
  // __DEV__ only: /onboarding?step=paywall opens a later step with sample previews.
  const { step } = useLocalSearchParams<{ step?: string }>();
  const seed =
    __DEV__ && step && ORDER.includes(step as Step)
      ? { step: step as Step, previewUrls: ["https://www.swipephotos.net/photos/presets/scene-restaurant.jpg", "https://www.swipephotos.net/photos/presets/scene-formal.jpg"] }
      : undefined;
  return (
    <FlowProvider seed={seed}>
      <Flow />
    </FlowProvider>
  );
}
