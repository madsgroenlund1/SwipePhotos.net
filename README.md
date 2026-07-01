# SwipeShot.ai

> Get 10x more matches with undetectable AI photos.

A full-stack Next.js application that generates professional AI dating profile photos for men.

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** v4
- **Supabase** (auth + postgres + storage)
- **Stripe** (payments + webhooks)
- **Replicate** (FLUX LoRA training + generation)
- **Resend** (transactional email)

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd swipeshot
npm install
```

### 2. Environment variables

Copy `.env.local` and fill in your keys:

```bash
cp .env.local .env.local
```

Required keys:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | After setting up webhook (step 5) |
| `REPLICATE_API_TOKEN` | replicate.com → Account → API tokens |
| `RESEND_API_KEY` | resend.com → API Keys |
| `ADMIN_PASSWORD` | Choose any secure password |

### 3. Supabase setup

1. Create a new Supabase project at supabase.com
2. Go to SQL Editor and run the migration:

```sql
-- Copy contents of supabase/migrations/001_init.sql and run
```

3. Create two storage buckets in Supabase Storage:
   - `uploads` — set to public
   - `generated` — set to public

### 4. Stripe setup

1. Create 3 products in Stripe dashboard:
   - **Starter** — $19 one-time
   - **Popular** — $39 one-time  
   - **Elite** — $79 one-time

2. Copy the Price IDs to `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_STRIPE_POPULAR_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID=price_xxxxx
   ```

3. Enable Stripe Tax (for EU VAT):
   - Stripe dashboard → Tax → Enable automatic tax

### 5. Stripe Webhook

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook secret to .env.local
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

For production, create a webhook endpoint in Stripe dashboard pointing to:
`https://yourdomain.com/api/webhooks/stripe`

Events to listen for:
- `checkout.session.completed`

### 6. Replicate setup

1. Create an account at replicate.com
2. You need a paid plan to create model training destinations
3. Create a model at: `https://replicate.com/create`
   - Name it something like `swipeshot/user-models`
   - Set to private

### 7. Resend setup

1. Create account at resend.com
2. Add and verify your sending domain
3. Create an API key

### 8. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/onboarding` | Multi-step onboarding flow |
| `/onboarding/processing` | Processing/progress screen |
| `/dashboard` | User dashboard (orders, referrals) |
| `/presets` | Browse all photo presets |
| `/affiliate` | Affiliate application |
| `/admin` | Admin panel (password protected) |
| `/admin/login` | Admin login |
| `/blog` | Blog index |
| `/blog/:slug` | Individual blog posts |
| `/privacy` | Privacy policy & terms |
| `/auth/signin` | Magic link sign in |

## API Routes

| Route | Description |
|---|---|
| `POST /api/auth/signup` | Create user account silently |
| `POST /api/checkout` | Create Stripe checkout session |
| `POST /api/upload` | Upload photos to Supabase storage |
| `POST /api/webhooks/stripe` | Stripe webhook handler |
| `GET /api/orders/[id]/status` | Poll order status |
| `GET /api/orders/[id]/download` | Get download URLs |
| `POST /api/admin/auth` | Admin login |
| `PATCH /api/admin/orders/[id]` | Update order status |
| `POST /api/admin/affiliates/[id]/approve` | Approve affiliate |
| `POST /api/affiliate/apply` | Submit affiliate application |

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Set all environment variables in Vercel dashboard → Project → Settings → Environment Variables.

After deployment, update `NEXT_PUBLIC_APP_URL` to your production URL and update the Stripe webhook endpoint.

---

## AI Pipeline

1. User uploads 10-20 photos → stored in Supabase storage
2. Stripe payment → webhook fires `checkout.session.completed`
3. Pipeline starts:
   - Train FLUX.1 LoRA on user's photos (~30-60 min)
   - Generate 4-10 photos per preset
   - Post-process (grain, EXIF, compression artifacts)
   - Save to Supabase storage
4. Email sent via Resend when ready
5. User downloads from dashboard

---

## Admin Access

Visit `/admin/login` and enter the password from `ADMIN_PASSWORD` env var.
