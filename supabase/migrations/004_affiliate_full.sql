-- ── 004: Affiliate system — click tracking, signups counter, payout columns ──

-- Add signups counter to affiliates
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS signups INTEGER DEFAULT 0;

-- More columns for payout management
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS paid_at     TIMESTAMPTZ;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS notes       TEXT;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS affiliate_email TEXT;

-- Per-click tracking for detailed stats
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID        NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  ip_hash      TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_clicks_affiliate_id_idx ON public.referral_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS referral_clicks_created_at_idx   ON public.referral_clicks(created_at);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "affiliate_read_own_clicks" ON public.referral_clicks
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- RPC: track one click — inserts into referral_clicks AND bumps the counter
CREATE OR REPLACE FUNCTION public.track_referral_click(
  p_affiliate_id UUID,
  p_ip_hash      TEXT DEFAULT NULL,
  p_user_agent   TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.referral_clicks(affiliate_id, ip_hash, user_agent)
  VALUES (p_affiliate_id, p_ip_hash, p_user_agent);

  UPDATE public.affiliates
  SET clicks = clicks + 1
  WHERE id = p_affiliate_id;
END;
$$;

-- RPC: increment signup counter (called when a referred user creates an account)
CREATE OR REPLACE FUNCTION public.increment_affiliate_signups(
  p_affiliate_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.affiliates
  SET signups = signups + 1
  WHERE id = p_affiliate_id;
END;
$$;

-- Allow admin client (service_role) to insert into payouts without RLS
-- Affiliates can only select their own
CREATE POLICY IF NOT EXISTS "affiliate_insert_own_payout" ON public.payouts
  FOR INSERT WITH CHECK (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );
