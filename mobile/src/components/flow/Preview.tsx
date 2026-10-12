import React from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { PREVIEW_LABELS, useFlow } from "@/lib/flow";
import { colors } from "@/lib/theme";
import { Body, Button, H1, Muted, Photo, ProgressBar } from "../ui";
import { StepLayout } from "./StepLayout";

export function GeneratingStep() {
  const flow = useFlow();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24, paddingHorizontal: 28 }}>
      <View style={{ width: 150, height: 150, borderRadius: 75, borderWidth: 8, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>{Math.round(flow.progress * 100)}%</Text>
      </View>
      <View style={{ alignSelf: "stretch" }}><ProgressBar value={flow.progress} /></View>
      <View style={{ alignItems: "center", gap: 8 }}>
        <H1 style={{ textAlign: "center" }}>Creating your preview</H1>
        <Body style={{ color: colors.blue400 }}>{flow.statusText}</Body>
      </View>
      <Muted style={{ textAlign: "center" }}>This takes about a minute. Please keep the app open.</Muted>
    </View>
  );
}

export function PickStep() {
  const flow = useFlow();
  const { width } = useWindowDimensions();
  const tile = (width - 20 * 2 - 12) / 2;

  return (
    <StepLayout
      title="Pick your favourite!"
      subtitle="Two looks, one you. Choose the one you like best."
      footer={<Button title="Continue" onPress={() => void flow.refine()} />}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        {flow.previewUrls.slice(0, 2).map((url, index) => {
          const selected = flow.pickedIndex === index;
          return (
            <Pressable
              key={url}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={PREVIEW_LABELS[index] ?? `Preview ${index + 1}`}
              onPress={() => flow.setPickedIndex(index)}
              style={{ gap: 8, alignItems: "center" }}
            >
              <View style={{ width: tile, height: tile * 4 / 3, borderRadius: 18, overflow: "hidden", borderWidth: selected ? 3 : 1, borderColor: selected ? colors.blue500 : colors.border }}>
                <Photo uri={url} style={{ width: "100%", height: "100%" }} />
                {selected ? (
                  <View style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.blue500, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontWeight: "800" }}>{"✓"}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: selected ? colors.blue400 : "#fff", fontWeight: "600", fontSize: 15 }}>
                {PREVIEW_LABELS[index] ?? `Preview ${index + 1}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Muted>AI-generated preview. Final results can differ slightly.</Muted>
    </StepLayout>
  );
}

export function RefiningStep() {
  const flow = useFlow();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 22, paddingHorizontal: 40 }}>
      <View style={{ width: 190, height: 250, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
        <Photo uri={flow.previewUrls[flow.pickedIndex]} style={{ width: "100%", height: "100%" }} />
      </View>
      <View style={{ alignItems: "center", gap: 8 }}>
        <H1 style={{ textAlign: "center" }}>Polishing your photo</H1>
        <Body style={{ color: colors.blue400, textAlign: "center" }}>{flow.statusText}</Body>
      </View>
      <View style={{ alignSelf: "stretch" }}><ProgressBar value={flow.progress} /></View>
    </View>
  );
}
