# SwipePhotos – iOS-app

Native SwiftUI-app (iOS 17+, kun iPhone) til swipephotos.net. Samme stil som hjemmesiden (mørkt tema, blå accent), og bygget til at blive **godkendt af App Review**:
native UI (ikke en web-wrapper), Apple In-App Purchase, Sign in with Apple, sletning af konto i appen, samtykke før AI-behandling og komplet privatlivsmanifest.

```
ios/
  SwipePhotos.xcodeproj      ← åbn denne i Xcode
  SwipePhotos/
    App/                     Indgang + rod-navigation
    Core/                    Config, tema, netværk, login-session, StoreKit, ordre-tjeneste
    Features/                Welcome, Auth, Onboarding (preview-flow + paywall), Home (fotos), Account
    Resources/               Assets (app-ikon), Info.plist, entitlements, PrivacyInfo, Products.storekit
  project.yml                XcodeGen-spec (alternativ til tools/gen_xcodeproj.py)
  tools/                     gen_xcodeproj.py, verify_xcodeproj.py, typecheck.sh
```

## 1. Åbn og kør

Kræver en Mac med **Xcode 16+**.

```bash
open ios/SwipePhotos.xcodeproj
```

1. Vælg target **SwipePhotos → Signing & Capabilities → Team** (dit Apple Developer-team).
2. Bundle ID er `net.swipephotos.app`. Skift det kun hvis det er optaget – og ret så `APPLE_BUNDLE_ID` på Vercel og `Plan.productID` i `Core/Config.swift`.
3. Vælg en iPhone-simulator og tryk **Run**. Schemet bruger `Products.storekit`, så køb kan testes lokalt uden App Store Connect (Xcode → Debug → StoreKit → Manage Transactions).
   *Lokale StoreKit-køb kan ikke verificeres af serveren (de er signeret af Xcode, ikke Apple) – brug Sandbox (afsnit 4) til ægte ende-til-ende-test.*

Hvis du tilføjer/fjerner Swift-filer: `python3 ios/tools/gen_xcodeproj.py` (eller `brew install xcodegen && cd ios && xcodegen generate`).

> **Bemærk:** Appen er skrevet og kontrolleret uden Xcode (typetjek via `ios/tools/typecheck.sh`, projektstruktur via `verify_xcodeproj.py`) – den er endnu ikke bygget og kørt på en rigtig enhed/simulator. Første build i Xcode kan kræve små rettelser; backend'en er derimod testet live.

## 2. Engangsopsætning på serveren (SKAL gøres før appen virker)

**a) Kør SQL i Supabase** (SQL Editor) – filen `supabase/migrations/015_mobile_app.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.mobile_login_codes (
  id BIGSERIAL PRIMARY KEY, email TEXT NOT NULL, code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, attempts INT NOT NULL DEFAULT 0,
  consumed BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS mobile_login_codes_email_idx ON public.mobile_login_codes (email, created_at DESC);
ALTER TABLE public.mobile_login_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT, ADD COLUMN IF NOT EXISTS apple_product_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_expires_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS apple_auto_renew BOOLEAN,
  ADD COLUMN IF NOT EXISTS apple_environment TEXT;
CREATE INDEX IF NOT EXISTS users_apple_otid_idx ON public.users (apple_original_transaction_id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_apple_transaction_id_uq ON public.orders (apple_transaction_id) WHERE apple_transaction_id IS NOT NULL;
```

**b) Vercel-miljøvariabler** (til Apples reviewer – de kan ikke læse en e-mailkode):

| Variabel | Værdi |
|---|---|
| `APPLE_REVIEW_EMAIL` | en adresse du vælger, fx `appreview@swipephotos.net` |
| `APPLE_REVIEW_CODE` | en 6-cifret kode du vælger |

Er begge sat, kan *kun* den ene konto logge ind med den faste kode (der sendes ingen mail). Ellers sker login med en mailet engangskode.

**c) Udfyld demo-kontoen** med et færdigt fotosæt, så reviewer ser et galleri uden at vente 30–60 min:

```bash
APPLE_REVIEW_EMAIL=appreview@swipephotos.net APPLE_REVIEW_CODE=123456 npx tsx scripts/seed-review-account.mts
```

**d) App Store Server Notifications V2** (App Store Connect → din app → App Information → *App Store Server Notifications*): sæt både *Production* og *Sandbox* URL til

```
https://www.swipephotos.net/api/webhooks/apple
```

## 3. Apple Developer / App Store Connect

1. **Apple Developer Program** (99 USD/år) og **Paid Applications Agreement** + bank/skat (Agreements, Tax, and Banking).
2. **Identifier** `net.swipephotos.app` med capabilities **Sign in with Apple** og **In-App Purchase** (Xcode slår dem til automatisk med automatic signing).
3. **Opret appen** i App Store Connect (Platform iOS, bundle ID ovenfor).
4. **Small Business Program** (ansøg først – Apples provision falder fra 30 % til **15 %** under 1 mio. USD/år).
5. **Abonnementer** → Subscription Group **"SwipePhotos Plans"** med disse 6 produkter (ID'erne skal være præcis disse):

| Product ID | Varighed | Level | Foreslået pris (EUR) |
|---|---|---|---|
| `net.swipephotos.app.pro.monthly` | 1 måned | 1 | 74,99 |
| `net.swipephotos.app.pro.yearly` | 1 år | 1 | 449,99 |
| `net.swipephotos.app.premium.monthly` | 1 måned | 2 | 49,99 |
| `net.swipephotos.app.premium.yearly` | 1 år | 2 | 299,99 |
| `net.swipephotos.app.starter.monthly` | 1 måned | 3 | 29,99 |
| `net.swipephotos.app.starter.yearly` | 1 år | 3 | 179,99 |

   Visningsnavn/beskrivelse: se `Products.storekit` (fx "Premium Monthly – 15 AI photos per month"). Tilføj en review-screenshot af betalingsskærmen til hvert produkt. Priserne er sat lidt over webprisen, så Apples provision ikke æder marginen – juster frit.
6. **App Privacy** (svar *Linked to the user, not used for tracking*, formål *App Functionality*): **Email Address**, **Photos or Videos**, **Purchases**, **User ID**. Privacy Policy URL `https://www.swipephotos.net/privacy`, Support URL `https://www.swipephotos.net/contact`.
7. **Aldersgrænse**: udfyld spørgeskemaet ærligt (ingen voldeligt/seksuelt indhold, ingen ubegrænset web). Der er et nyt afsnit om AI-genereret indhold – svar efter appens funktion (billedgenerering fra brugerens egne fotos).
8. **Skærmbilleder**: mindst 3 til 6,9" iPhone (1320 × 2868). Foreslået: velkomst, valg af stil, preview, betaling, færdigt galleri.
9. Byg: Product → **Archive** → Distribute App → App Store Connect. Test via **TestFlight** først.

### Tekst til App Review → "Notes"

```
Sign-in: tap "Sign in" and enter the demo account below. (The account accepts a fixed code, no e-mail needed.)
  E-mail: <APPLE_REVIEW_EMAIL>      Code: <APPLE_REVIEW_CODE>
The demo account already contains a finished photo set. Generating a NEW set takes 30–60 minutes on our servers.
To test the purchase flow: sign out, tap "Generate your free preview", complete the free preview (needs 4 photos of one person),
then choose a plan on the final screen and buy with a Sandbox account. After purchase the app shows the order being created;
photos are delivered here and by e-mail when ready.
Photos are processed by our AI provider fal.ai; users give explicit consent before uploading (step "Before you upload").
Account deletion: Account tab → Delete account.
```

## 4. Test med Sandbox (ende-til-ende)

1. App Store Connect → Users and Access → **Sandbox** → opret en testbruger.
2. Installér via Xcode/TestFlight på en rigtig iPhone (Indstillinger → App Store → Sandbox-konto).
3. Gennemfør preview → køb. Sandbox-abonnementer fornyes hurtigt (månedlig = 5 min), så du kan teste fornyelse/udløb.
4. Tjek i Supabase: `users.apple_*` og `orders.apple_transaction_id` er udfyldt.

## 5. Sådan opfylder appen Apples regler

| Regel | Løsning |
|---|---|
| **3.1.1 / 3.1.2** Digitale ydelser skal købes med IAP; tydelig pris/periode/auto-fornyelse | Kun StoreKit i appen (ingen Stripe/links til web-køb). Betalingsskærmen viser pris, periode, auto-fornyelsesvilkår, Terms/Privacy og **Restore Purchases** |
| **3.1.3(b)** Adgang til abonnement købt andetsteds | Web-abonnenter kan logge ind og bruge deres sæt; IAP tilbydes også |
| **4.8** Sign in with Apple | Tilbydes ved siden af e-mailkode (ingen tredjeparts-login som Google) |
| **5.1.1(v)** Slet konto i appen | Account → Delete account → sletter alt (Clerk, database, fotos). Test: gammelt token bliver ugyldigt |
| **5.1.2(i)** Samtykke før deling med tredjeparts-AI | Eget trin "Before you upload" nævner fal.ai og kræver afkrydsning + 18+ |
| **4.2** Minimumsfunktionalitet | Fuld native app, ikke en web-wrapper |
| **2.1** Demo-konto | `APPLE_REVIEW_EMAIL/CODE` + seedet galleri |
| **5.1.1 / privacy** | `PrivacyInfo.xcprivacy`, brugsbeskrivelser for kamera/gem-foto, kun add-only adgang til fotos |
| **2.3** Ærlig markedsføring | Ingen "undetectable"/gange-flere-matches-påstande og ingen falsk "AI-detektor"-animation i appen |
| Kun iPhone, kun portræt | Undgår iPad-screenshots/layout-krav |

## 6. Hvad serveren gør (nye endpoints)

`/api/mobile/auth/code/{start,verify}`, `/api/mobile/auth/apple`, `/api/mobile/me`, `/api/mobile/orders` (+ `/[id]`, `/[id]/photos`, `/[id]/start`, `/[id]/iap`), `/api/mobile/iap/sync`, `/api/webhooks/apple`.
Køb verificeres ved at kontrollere Apples signaturkæde mod **Apple Root CA G3** (fastlåst i koden), at køb tilhører netop den ordre (`appAccountToken`), er ubrugt (unikt index) og matcher planen. Tests: `npx tsx scripts/test-apple-iap.ts` og `scripts/test-mobile-auth.mts` (kører offline).

## 7. Kendte begrænsninger / bevidste valg

- **Nyt sæt pr. måned**: abonnenter trykker selv "Create new photos" (ét sæt pr. periode; årsabonnement = ét pr. 30 dage). Hjemmesiden genererer heller ikke automatisk ved fornyelse.
- **Ingen push-notifikationer** endnu – kunder får e-mail når billederne er klar, og appen opdaterer sig når den åbnes.
- **Affiliate-program** er ikke med i appen (undgår Apple-diskussion om provisioner).
- De åbne preview-endpoints (`/api/generate/preview`) kan misbruges til at brænde fal.ai-credits; overvej rate limiting (Cloudflare) eller App Attest senere.
- `Products.storekit`-priser er kun til lokal test; de rigtige priser sættes i App Store Connect.
