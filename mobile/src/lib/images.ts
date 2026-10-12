import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { PickedPhoto } from "./types";

export const MIN_BYTES = 15_000;
const MAX_SIDE = 1024;

/** Same pipeline as the website: longest side ≤ 1024 px, JPEG quality 0.85. */
export async function preparePhoto(asset: { uri: string; width: number; height: number }): Promise<PickedPhoto> {
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);
  if (longest > MAX_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });

  let bytes: number;
  if (Platform.OS === "web") {
    bytes = (await (await fetch(saved.uri)).blob()).size;
  } else {
    bytes = new File(saved.uri).size ?? 0;
  }
  return { uri: saved.uri, bytes };
}

/** Appends the photo to a FormData under `field` with a stable file name. */
export async function appendPhoto(form: FormData, field: string, photo: PickedPhoto, fileName: string): Promise<void> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(photo.uri)).blob();
    form.append(field, blob, fileName);
    return;
  }
  const destination = new File(Paths.cache, fileName);
  if (destination.exists) destination.delete();
  new File(photo.uri).copy(destination);
  form.append(field, destination as unknown as Blob);
}
