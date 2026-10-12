import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";

async function download(url: string, name: string): Promise<File> {
  const destination = new File(Paths.cache, name);
  if (destination.exists) destination.delete();
  return File.downloadFileAsync(url, destination);
}

function webDownload(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Saves the photos to the device's photo library. Returns how many were saved. */
export async function saveToLibrary(urls: string[]): Promise<number> {
  if (Platform.OS === "web") {
    urls.forEach((u, i) => webDownload(u, `swipephoto-${i + 1}.jpg`));
    return urls.length;
  }
  // Loaded lazily: the native module doesn't exist on web.
  const { Asset, requestPermissionsAsync } = await import("expo-media-library");
  const { status } = await requestPermissionsAsync(true);
  if (status !== "granted") {
    throw new Error("Allow SwipePhotos to save photos in your device settings.");
  }
  let saved = 0;
  for (let i = 0; i < urls.length; i++) {
    const file = await download(urls[i], `swipephoto-${Date.now()}-${i}.jpg`);
    await Asset.create(file.uri);
    saved++;
  }
  return saved;
}

export async function sharePhoto(url: string): Promise<void> {
  if (Platform.OS === "web") { webDownload(url, "swipephoto.jpg"); return; }
  const Sharing = await import("expo-sharing");
  const file = await download(url, `share-${Date.now()}.jpg`);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "image/jpeg" });
}
