-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'draft',
  stripe_session_id TEXT,
  replicate_training_id TEXT,
  selected_presets TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploads (user-submitted photos)
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated photos
CREATE TABLE IF NOT EXISTS public.generated_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  preset TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Presets
CREATE TABLE IF NOT EXISTS public.presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  prompt_template TEXT,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Affiliates
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  earnings_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY "Users read own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Orders: users can read their own
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Generated photos: users can read their own
CREATE POLICY "Users read own photos" ON public.generated_photos
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- Seed presets
INSERT INTO public.presets (name, description, category, prompt_template, is_premium, sort_order) VALUES
  ('Outdoor Adventure', 'Hiking, nature, golden hour', 'Outdoor', 'photo of TOK man hiking in mountains, golden hour light, casual outfit, backpack, natural smile, shot on iPhone, candid lifestyle', false, 1),
  ('City Life', 'Urban, street, café', 'Social', 'photo of TOK man walking on city street, urban background, stylish casual outfit, natural expression, shallow depth of field, smartphone photography', false, 2),
  ('Rooftop Bar', 'Evening, city lights, confident', 'Social', 'photo of TOK man at rooftop bar at dusk, city skyline background, confident smile, evening wear, bokeh lights, lifestyle photography', true, 3),
  ('Beach Vibes', 'Summer, casual, relaxed', 'Outdoor', 'photo of TOK man at beach, summer vibes, casual shirt, relaxed pose, golden hour, ocean in background, candid shot', true, 4),
  ('Home Studio', 'Clean, minimal, indoor', 'Indoor', 'photo of TOK man sitting at home, clean modern interior, casual outfit, natural window light, genuine smile, iPhone photography', true, 5),
  ('Marina Walk', 'Boats, sunshine, lifestyle', 'Outdoor', 'photo of TOK man walking along marina, boats in background, sunny day, casual summer outfit, lifestyle photo, candid moment', true, 6),
  ('Coffee Shop', 'Cozy, natural light, candid', 'Indoor', 'photo of TOK man in cozy coffee shop, natural light from window, laptop nearby, casual smart outfit, genuine candid expression', true, 7),
  ('Black & White', 'Dramatic, artistic, bold', 'Lifestyle', 'black and white photo of TOK man, dramatic lighting, sharp contrast, confident expression, artistic portrait, film photography style', true, 8)
ON CONFLICT DO NOTHING;
