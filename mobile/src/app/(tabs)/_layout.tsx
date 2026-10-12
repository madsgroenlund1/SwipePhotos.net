import React from "react";
import { ColorValue, Text } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

const icon = (glyph: string) => ({ color }: { color: ColorValue }) => (
  <Text style={{ fontSize: 22, color }} accessible={false}>{glyph}</Text>
);

export default function TabsLayout() {
  const { ready, signedIn } = useAuth();
  if (ready && !signedIn) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue500,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="photos" options={{ title: "Photos", tabBarIcon: icon("▣") }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: icon("●") }} />
    </Tabs>
  );
}
