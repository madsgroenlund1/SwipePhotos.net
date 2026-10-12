import React, { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import { Body, Button, ErrorBanner, H1, Muted, Screen, Wordmark } from "@/components/ui";

/** Passwordless sign-in: Sign in with Apple (iOS) or a 6-digit code sent by e-mail. */
export default function SignIn() {
  const router = useRouter();
  const { requestCode, verifyCode, signInWithApple } = useAuth();
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
  const done = () => (router.canGoBack() ? router.back() : router.replace("/photos"));

  async function sendCode() {
    const address = email.trim().toLowerCase();
    if (!address.includes("@")) return;
    setBusy(true); setError(null);
    try {
      await requestCode(address);
      setEmail(address);
      setPhase("code");
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }

  async function verify(value: string) {
    if (value.length !== 6 || busy) return;
    setBusy(true); setError(null);
    try {
      await verifyCode(email, value);
      done();
    } catch (e) { setError(message(e)); setCode(""); } finally { setBusy(false); }
  }

  async function apple() {
    setBusy(true); setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) throw new Error("no token");
      await signInWithApple(credential.identityToken);
      done();
    } catch (e: any) {
      if (e?.code !== "ERR_REQUEST_CANCELED") setError("Sign in with Apple didn’t complete. Please try again.");
    } finally { setBusy(false); }
  }

  const inputStyle = {
    backgroundColor: colors.fill, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border,
    color: "#fff", fontSize: 18, padding: 16,
  } as const;

  return (
    <Screen scroll>
      <View style={{ gap: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Wordmark />
          <Pressable accessibilityLabel="Close" onPress={done} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 16 }}>{"✕"}</Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <H1>{phase === "email" ? "Sign in or create your account" : "Check your e-mail"}</H1>
          <Body style={{ color: colors.textSecondary }}>
            {phase === "email" ? "We’ll send you a 6-digit code. No password needed." : `We sent a 6-digit code to ${email}.`}
          </Body>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        {phase === "email" ? (
          <View style={{ gap: 16 }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textFaint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={sendCode}
              accessibilityLabel="E-mail address"
              style={inputStyle}
            />
            <Button title="Continue" onPress={sendCode} loading={busy} disabled={!email.includes("@")} />

            {Platform.OS === "ios" ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  <Muted>or</Muted>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={radius.button}
                  style={{ height: 52 }}
                  onPress={apple}
                />
              </>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <TextInput
              value={code}
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, "").slice(0, 6);
                setCode(digits);
                if (digits.length === 6) void verify(digits);
              }}
              placeholder="123456"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              accessibilityLabel="6-digit code"
              style={{ ...inputStyle, textAlign: "center", fontSize: 30, fontWeight: "700", letterSpacing: 6 }}
            />
            <Button title="Sign in" onPress={() => verify(code)} loading={busy} disabled={code.length !== 6} />
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}>
              <Pressable onPress={sendCode} disabled={busy}><Muted>Resend code</Muted></Pressable>
              <Pressable onPress={() => { setPhase("email"); setCode(""); setError(null); }}><Muted>Use a different e-mail</Muted></Pressable>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
