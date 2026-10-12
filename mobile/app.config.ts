import type { ExpoConfig } from "expo/config";

// Hele appens konfiguration. Bundle-id / package er identiske på iOS og Android.
// EAS-projekt-id sættes af `npx eas-cli@latest init` (se README.md).
const config: ExpoConfig = {
  name: "SwipePhotos",
  slug: "swipephotos",
  scheme: "swipephotos",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  backgroundColor: "#0A0A0A",
  primaryColor: "#2563EB",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "net.swipephotos.app",
    usesAppleSignIn: true,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      NSCameraUsageDescription:
        "SwipePhotos uses the camera so you can take the photos of yourself that your AI photos are created from.",
      NSPhotoLibraryAddUsageDescription:
        "SwipePhotos saves your finished AI photos to your photo library when you tap Save.",
    },
    privacyManifests: {
      NSPrivacyCollectedDataTypes: [
        { NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress", NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
        { NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhotosorVideos", NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
        { NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePurchaseHistory", NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
        { NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeUserID", NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false, NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
      ],
    },
  },
  android: {
    package: "net.swipephotos.app",
    adaptiveIcon: {
      backgroundColor: "#2563EB",
      foregroundImage: "./assets/android-icon-foreground.png",
    },
    predictiveBackGestureEnabled: false,
    permissions: ["CAMERA", "com.android.vending.BILLING"],
    blockedPermissions: ["android.permission.RECORD_AUDIO"],
  },
  web: { bundler: "metro", output: "single", favicon: "./assets/favicon.png" },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-apple-authentication",
    "expo-web-browser",
    "expo-iap",
    [
      "expo-image-picker",
      {
        photosPermission: "SwipePhotos needs access to your photos so you can choose the pictures of yourself to use.",
        cameraPermission: "SwipePhotos uses the camera so you can take the photos of yourself that your AI photos are created from.",
      },
    ],
    [
      "expo-media-library",
      {
        photosPermission: "SwipePhotos saves your finished AI photos to your photo library when you tap Save.",
        savePhotosPermission: "SwipePhotos saves your finished AI photos to your photo library when you tap Save.",
        isAccessMediaLocationEnabled: false,
      },
    ],
    [
      "expo-build-properties",
      { ios: { deploymentTarget: "16.4" }, android: { minSdkVersion: 26 } },
    ],
  ],
  owner: "groenlund",
  extra: {
    router: {},
    // Base-URL kan overstyres ved udvikling: EXPO_PUBLIC_API_URL=http://localhost:3000
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://www.swipephotos.net",
  },
};

export default config;
