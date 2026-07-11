-- Track retention offers per user to prevent abuse
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS retention_offer_type        TEXT,
  ADD COLUMN IF NOT EXISTS retention_offer_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id      TEXT;
