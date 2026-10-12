# SwipePhotos – Expo app (iOS + Android)

Bundle id / package: `net.swipephotos.app`. Talks to https://www.swipephotos.net (`/api/mobile/*`).

## Run locally
```bash
cd mobile && npm install
npx expo start            # scan QR with Expo Go (purchases need a dev build)
npx expo start --web      # quick UI check; IAP is disabled on web
```
Point at another backend with `EXPO_PUBLIC_API_URL=http://localhost:3000`.
`tools/mock-server.py` is a stand-in API for UI work without credits.

## First-time store setup
1. `npx eas-cli@latest init` – writes `extra.eas.projectId` into app.config.ts.
2. Apple: create the 6 auto-renewing subscriptions (`net.swipephotos.app.{starter|premium|pro}.{monthly|yearly}`) in one group; set App Store Server Notifications V2 URL to `https://www.swipephotos.net/api/webhooks/apple`; enable Sign in with Apple.
3. Google Play: create the app, the same 6 subscription ids, a service account with "View financial data / Manage orders", and set Vercel env `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (raw JSON or base64).
4. Supabase: run migrations 014, 015 and 016.
5. Vercel env `APPLE_REVIEW_EMAIL` / `APPLE_REVIEW_CODE`, then `npx tsx scripts/seed-review-account.mts` (demo login for App Review).

## Build & submit
```bash
eas build --profile preview --platform all      # internal test builds
eas build --profile production --platform all
eas submit --platform ios                        # App Store Connect API key in eas.json
eas submit --platform android                    # needs google-play-service-account.json
```
