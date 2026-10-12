import React, { useState } from "react";
import { Alert, Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { useFlow } from "@/lib/flow";
import { exampleImage, PhotoSlot, PRIVACY_URL, SLOT_INFO, STYLES, sceneImage } from "@/lib/config";
import { colors } from "@/lib/theme";
import { Badge, Button, Card, ErrorBanner, Muted, Photo, Row } from "../ui";
import { StepLayout } from "./StepLayout";

// ─── Step: style ──────────────────────────────────────────────────────────────

export function StyleStep() {
  const flow = useFlow();
  const { width } = useWindowDimensions();
  const tile = (width - 20 * 2 - 12) / 2;

  return (
    <StepLayout
      title="Pick a style"
      subtitle="Choose the setting for your free preview. Paid plans unlock 40+ templates."
      footer={<Button title="Continue" onPress={() => flow.setStep("consent")} />}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {STYLES.map((s) => {
          const selected = flow.style === s.id;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={s.title}
              onPress={() => flow.setStyle(s.id)}
              style={{
                width: tile, height: tile * 4 / 3, borderRadius: 18, overflow: "hidden",
                borderWidth: selected ? 2.5 : 1, borderColor: selected ? colors.blue500 : colors.border,
              }}
            >
              <Photo uri={sceneImage(s.id)} style={{ width: "100%", height: "100%" }} />
              <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(0,0,0,0.55)", flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>{s.title}</Text>
                {selected ? <Text style={{ color: colors.blue400 }}>{"✓"}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </StepLayout>
  );
}

// ─── Step: consent (AI processing by a third party + age) ─────────────────────

function Check({ checked, onPress, children }: { checked: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
      <View style={{
        width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: checked ? colors.blue500 : colors.textMuted,
        backgroundColor: checked ? colors.blue500 : "transparent", alignItems: "center", justifyContent: "center", marginTop: 1,
      }}>
        {checked ? <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{"✓"}</Text> : null}
      </View>
      <Text style={{ flex: 1, color: "rgba(255,255,255,0.92)", fontSize: 14, lineHeight: 20 }}>{children}</Text>
    </Pressable>
  );
}

export function ConsentStep() {
  const flow = useFlow();
  const points: [string, string, string][] = [
    ["✨", "AI image generation", "To create your photos, your pictures are sent securely to our AI image provider, fal.ai (USA). They are used only to generate your images — never to train AI models."],
    ["🔒", "Stored securely", "Your photos and results are stored on our servers in the EU. You can delete everything at any time with Account → Delete account."],
    ["👤", "Only photos of you", "Upload photos of yourself only. The app is for adults (18+)."],
  ];

  return (
    <StepLayout
      title="Before you upload"
      subtitle="Your photos are personal. Here is exactly what happens to them."
      footer={<Button title="Agree & continue" disabled={!(flow.agreed && flow.adult)} onPress={() => flow.setStep("photos")} />}
    >
      <Card style={{ gap: 16 }}>
        {points.map(([icon, title, text]) => (
          <View key={title} style={{ flexDirection: "row", gap: 14 }}>
            <Text style={{ fontSize: 20, width: 28 }}>{icon}</Text>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{text}</Text>
            </View>
          </View>
        ))}
      </Card>
      <View style={{ gap: 14, marginTop: 4 }}>
        <Check checked={flow.agreed} onPress={() => flow.setAgreed(!flow.agreed)}>
          I agree that my photos are sent to fal.ai to create my images, as described in the Privacy Policy.
        </Check>
        <Check checked={flow.adult} onPress={() => flow.setAdult(!flow.adult)}>
          I am 18 or older, and the person in the photos.
        </Check>
      </View>
      <Pressable onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
        <Muted style={{ textAlign: "center", marginTop: 6 }}>Read the Privacy Policy</Muted>
      </Pressable>
    </StepLayout>
  );
}

// ─── Step: photos ─────────────────────────────────────────────────────────────

function SlotTile({ slot, width }: { slot: PhotoSlot; width: number }) {
  const flow = useFlow();
  const photo = flow.photos[slot];

  async function fromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsEditing: false });
    if (!result.canceled && result.assets[0]) await flow.setPhoto(slot, result.assets[0]);
  }

  async function fromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      flow.setError("Allow camera access in your device settings to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
    if (!result.canceled && result.assets[0]) await flow.setPhoto(slot, result.assets[0]);
  }

  function choose() {
    if (Platform.OS === "web") { void fromLibrary(); return; }
    Alert.alert(SLOT_INFO[slot].title, SLOT_INFO[slot].hint, [
      { text: "Take photo", onPress: () => void fromCamera() },
      { text: "Choose from library", onPress: () => void fromLibrary() },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${SLOT_INFO[slot].title} photo. ${photo ? "Added" : "Not added"}. ${SLOT_INFO[slot].hint}`}
      onPress={choose}
      style={{
        width, height: width * 4 / 3, borderRadius: 18, overflow: "hidden", backgroundColor: colors.fill,
        borderWidth: photo ? 2 : 1, borderColor: photo ? colors.green : colors.border,
      }}
    >
      {photo ? (
        <Photo uri={photo.uri} style={{ width: "100%", height: "100%" }} />
      ) : (
        <>
          <Photo uri={exampleImage(slot)} style={{ width: "100%", height: "100%", opacity: 0.28 }} />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Text style={{ fontSize: 30, color: colors.blue400 }}>{"＋"}</Text>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
          </View>
        </>
      )}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", paddingVertical: 8, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>{SLOT_INFO[slot].title}</Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }} numberOfLines={1}>{SLOT_INFO[slot].hint}</Text>
      </View>
      {photo ? (
        <View style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#000", fontWeight: "800", fontSize: 13 }}>{"✓"}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function PhotosStep() {
  const flow = useFlow();
  const { width } = useWindowDimensions();
  const tile = (width - 20 * 2 - 12) / 2;
  const added = flow.requiredSlots.filter((s) => flow.photos[s]).length;
  const rules = ["Face clearly visible", "Natural lighting", "No sunglasses or hats", "One person only", "No filters"];

  return (
    <StepLayout
      title={`Upload ${flow.requiredSlots.length} photos`}
      subtitle="A relaxed, closed-mouth smile works best. Use the examples as a guide."
      footer={
        <>
          <Button title="Generate my free preview" disabled={!flow.photosComplete} onPress={() => void flow.generatePreviews()} />
          {!flow.photosComplete ? (
            <Muted style={{ textAlign: "center" }}>{added} of {flow.requiredSlots.length} photos added</Muted>
          ) : null}
        </>
      }
    >
      <View style={{ gap: 8 }}>
        {rules.map((rule) => (
          <Row key={rule} style={{ gap: 8 }}>
            <Text style={{ color: colors.green }}>{"✓"}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{rule}</Text>
          </Row>
        ))}
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: flow.hasTattoos }}
        onPress={() => flow.setHasTattoos(!flow.hasTattoos)}
      >
        <Card padding={14} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>I have tattoos</Text>
            <Muted>Adds a 5th photo so we can reproduce them.</Muted>
          </View>
          <Badge text={flow.hasTattoos ? "Yes" : "No"} tint={flow.hasTattoos ? colors.green : colors.textMuted} />
        </Card>
      </Pressable>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {flow.requiredSlots.map((slot) => <SlotTile key={slot} slot={slot} width={tile} />)}
      </View>

      {flow.error ? <ErrorBanner message={flow.error} /> : null}
    </StepLayout>
  );
}
