import React from "react";
import {
  ActivityIndicator, Image, ImageStyle, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle, StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "@/lib/theme";

// ─── Layout ───────────────────────────────────────────────────────────────────

/** Page with the site's near-black background and soft blue glow at the top. */
export function Screen({
  children, scroll = false, padded = true, footer, edges = ["top", "bottom"],
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  footer?: React.ReactNode;
  edges?: ("top" | "bottom")[];
}) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[padded && styles.padded, { paddingBottom: 28 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded]}>{children}</View>
  );
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["rgba(37,99,235,0.18)", "rgba(37,99,235,0)"]}
        style={styles.glow}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.flex} edges={edges}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}

// ─── Text ─────────────────────────────────────────────────────────────────────

export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}
export function H2({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}
export function Body({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}
export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}
export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children.toUpperCase()}</Text>;
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <Text accessibilityLabel="SwipePhotos.net" style={{ fontSize: size, fontWeight: "700", color: colors.text }}>
      SwipePhotos<Text style={{ color: colors.blue500 }}>.net</Text>
    </Text>
  );
}

/** Title + subtitle block used at the top of flow steps. */
export function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 8, marginBottom: 20 }}>
      <H1>{title}</H1>
      {subtitle ? <Body style={{ color: colors.textSecondary }}>{subtitle}</Body> : null}
    </View>
  );
}

// ─── Controls ─────────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "destructive" | "ghost";

export function Button({
  title, onPress, variant = "primary", disabled = false, loading = false, style, accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const inactive = disabled || loading;
  const textColor =
    variant === "primary" ? (inactive ? colors.textFaint : "#fff")
    : variant === "destructive" ? colors.red
    : variant === "ghost" ? colors.blue400
    : "#fff";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && (inactive ? styles.buttonPrimaryOff : styles.buttonPrimary),
        variant === "secondary" && styles.buttonSecondary,
        variant === "destructive" && styles.buttonDestructive,
        variant === "ghost" && styles.buttonGhost,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style, padding = 16 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padding?: number }) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

export function Badge({ text, tint = colors.blue500 }: { text: string; tint?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: tint + "24", borderColor: tint + "40" }]}>
      <Text style={[styles.badgeText, { color: tint }]}>{text}</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: colors.red + "1A", borderColor: colors.red + "40" }]} accessibilityRole="alert">
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

export function NoticeBanner({ message }: { message: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: colors.amber + "1A", borderColor: colors.amber + "40" }]}>
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0.03, Math.min(1, value)) * 100;
  return (
    <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

/** Remote image with a dark placeholder behind it. */
export function Photo({ uri, style, contain = false }: { uri?: string | null; style?: StyleProp<ImageStyle>; contain?: boolean }) {
  return (
    <Image
      source={uri ? { uri } : undefined}
      style={[{ backgroundColor: colors.fill }, style]}
      resizeMode={contain ? "contain" : "cover"}
      accessibilityIgnoresInvertColors
    />
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", alignItems: "center" }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 360 },
  padded: { paddingHorizontal: 20, paddingTop: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, gap: 8, backgroundColor: "rgba(10,10,10,0.96)" },
  h1: { fontSize: 28, fontWeight: "700", color: colors.text, lineHeight: 34 },
  h2: { fontSize: 20, fontWeight: "700", color: colors.text },
  body: { fontSize: 16, color: colors.text, lineHeight: 23 },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  eyebrow: { fontSize: 12, fontWeight: "600", letterSpacing: 1.6, color: colors.textMuted },
  button: { minHeight: 54, borderRadius: radius.button, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  buttonPrimary: {
    backgroundColor: colors.blue600,
    shadowColor: colors.blue500, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  buttonPrimaryOff: { backgroundColor: colors.fill },
  buttonSecondary: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: colors.border },
  buttonDestructive: { backgroundColor: colors.red + "1A", borderWidth: 1, borderColor: colors.red + "40" },
  buttonGhost: { minHeight: 44 },
  buttonText: { fontSize: 17, fontWeight: "600" },
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border },
  badge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  banner: { padding: 14, borderRadius: 14, borderWidth: 1 },
  bannerText: { color: "rgba(255,255,255,0.92)", fontSize: 14, lineHeight: 20 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.blue500 },
});
