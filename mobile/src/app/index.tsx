import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/lib/auth";
import { PRIVACY_URL, SITE_URL, SUPPORT_EMAIL, TERMS_URL } from "@/lib/config";
import { colors } from "@/lib/theme";
import { Body, Button, Card, Eyebrow, H1, H2, Muted, Photo, Row, Screen, Wordmark } from "@/components/ui";
import { Linking } from "react-native";

const STEPS: [string, string, string][] = [
  ["1", "Upload 4 photos", "Free · no account needed"],
  ["2", "Preview your results", "Two free looks, picked for you"],
  ["3", "Choose a plan", "Pay with the App Store or Google Play"],
  ["4", "Get your photos", "Delivered here and by e-mail"],
];

const RESULTS = ["benni", "jason", "black", "julius"].map((id) => ({
  id,
  before: `${SITE_URL}/photos/before-after/${id}/before/1.${id === "julius" ? "jpeg" : "jpg"}`,
  after: `${SITE_URL}/photos/before-after/${id}/after/1.jpg`,
}));

export default function Welcome() {
  const router = useRouter();
  const { ready, signedIn } = useAuth();
  if (!ready) return <Screen><View /></Screen>;
  if (signedIn) return <Redirect href="/photos" />;

  return (
    <Screen scroll>
      <View style={{ gap: 28 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Wordmark />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/sign-in")}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Sign in</Text>
          </Pressable>
        </Row>

        <View style={{ gap: 14 }}>
          <H1 style={{ fontSize: 38, lineHeight: 44 }}>Dating photos that look like you {"—"} at your best.</H1>
          <Body style={{ color: colors.textSecondary, fontSize: 17 }}>
            Upload a few photos of yourself. Our AI places the real you in great settings, so your profile finally shows your best side.
          </Body>
        </View>

        <View style={{ gap: 10 }}>
          <Button title={"Generate your free preview →"} onPress={() => router.push("/onboarding")} />
          <Muted style={{ textAlign: "center" }}>Free preview {"·"} No credit card to start</Muted>
        </View>

        <View style={{ gap: 14 }}>
          <Eyebrow>Real results</Eyebrow>
          <H2 style={{ fontSize: 26 }}>Before {"→"} after</H2>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }} style={{ marginHorizontal: -20 }}>
            <View style={{ width: 6 }} />
            {RESULTS.map((r) => (
              <Card key={r.id} padding={12} style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ gap: 6 }}>
                  <Muted>BEFORE</Muted>
                  <Photo uri={r.before} style={{ width: 96, height: 128, borderRadius: 12 }} />
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.blue400, fontWeight: "600" }}>AFTER {"✨"}</Text>
                  <Photo uri={r.after} style={{ width: 150, height: 128, borderRadius: 12 }} />
                </View>
              </Card>
            ))}
            <View style={{ width: 6 }} />
          </ScrollView>
        </View>

        <View style={{ gap: 14 }}>
          <Eyebrow>How it works</Eyebrow>
          {STEPS.map(([n, title, sub]) => (
            <Card key={n} padding={14} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(37,99,235,0.18)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: colors.blue400, fontWeight: "700" }}>{n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{sub}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={{ gap: 10, alignItems: "center" }}>
          <Row style={{ gap: 18 }}>
            <Pressable onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}><Muted>Terms</Muted></Pressable>
            <Pressable onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}><Muted>Privacy</Muted></Pressable>
            <Pressable onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}><Muted>Support</Muted></Pressable>
          </Row>
          <Muted>AI-generated images. Results can vary.</Muted>
        </View>
      </View>
    </Screen>
  );
}
