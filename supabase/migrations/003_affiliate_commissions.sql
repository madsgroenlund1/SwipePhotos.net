-- Add referral attribution column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- Commissions: one row per paid order with a referral
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id),
  amount_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | paid | rejected
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Affiliates read their own commissions
CREATE POLICY "affiliate_read_own_commissions" ON public.commissions
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Affiliates read their own row
CREATE POLICY "affiliate_read_own" ON public.affiliates
  FOR SELECT USING (user_id = auth.uid());

-- Payouts: enable RLS + self-read policy
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_read_own_payouts" ON public.payouts
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Uploads: authenticated users can read uploads for their own orders
CREATE POLICY "user_read_own_uploads" ON public.uploads
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Atomic helper: increment affiliate conversion stats
CREATE OR REPLACE FUNCTION public.increment_affiliate_stats(
  p_affiliate_id UUID,
  p_conversions INTEGER DEFAULT 0,
  p_earnings_cents INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.affiliates
  SET
    conversions   = conversions   + p_conversions,
    earnings_cents = earnings_cents + p_earnings_cents
  WHERE id = p_affiliate_id;
END;
$$;

-- Atomic helper: increment affiliate click count
CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks(
  p_affiliate_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.affiliates
  SET clicks = clicks + 1
  WHERE id = p_affiliate_id;
END;
$$;
