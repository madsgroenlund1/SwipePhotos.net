import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/** Secure storage for the session token (Keychain / Keystore). localStorage on web (dev only). */
export const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") { localStorage?.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") { localStorage?.removeItem(key); return; }
    try { await SecureStore.deleteItemAsync(key); } catch { /* ignore */ }
  },
};
