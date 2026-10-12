import React, { useRef, useState } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMe } from "@/lib/me";
import { saveToLibrary, sharePhoto } from "@/lib/library";
import { Button, Photo } from "@/components/ui";

/** Full-screen photo pager with Save and Share. */
export default function Viewer() {
  const { order: orderId, index: startIndex } = useLocalSearchParams<{ order: string; index: string }>();
  const router = useRouter();
  const { orders } = useMe();
  const { width, height } = useWindowDimensions();
  const urls = orders.find((o) => o.id === orderId)?.photos ?? [];
  const [index, setIndex] = useState(Number(startIndex ?? 0) || 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2500);
  };

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await action(); flash(ok); } catch (e) { flash(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList
        data={urls}
        keyExtractor={(u) => u}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={Math.min(index, Math.max(urls.length - 1, 0))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, height, justifyContent: "center" }}>
            <Photo uri={item} contain style={{ width, height: height * 0.75 }} />
          </View>
        )}
      />
      <View style={{ position: "absolute", top: 54, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Pressable accessibilityLabel="Close" onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 16 }}>{"✕"}</Text>
        </Pressable>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>{urls.length ? `${index + 1} / ${urls.length}` : ""}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={{ position: "absolute", bottom: 40, left: 20, right: 20, flexDirection: "row", gap: 12 }}>
        <Button title="Save" variant="secondary" style={{ flex: 1 }} disabled={busy || !urls[index]}
          onPress={() => run(() => saveToLibrary([urls[index]]), "Saved to your library")} />
        <Button title="Share" variant="secondary" style={{ flex: 1 }} disabled={busy || !urls[index]}
          onPress={() => run(() => sharePhoto(urls[index]), "Ready to share")} />
      </View>
      {message ? (
        <View style={{ position: "absolute", top: "45%", alignSelf: "center", backgroundColor: "rgba(39,39,42,0.95)", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
}
