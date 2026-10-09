-- iOS app support: passwordless email-code login + Apple In-App Purchase state.

-- One-time sign-in codes e-mailed to app users. Only a salted hash is stored.
CREATE TABLE IF NOT EXISTS public.mobile_login_codes (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT        NOT NULL,
  code_hash   TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT         NOT NULL DEFAULT 0,
  consumed    BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mobile_login_codes_email_idx
  ON public.mobile_login_codes (email, created_at DESC);
-- Service role only (no policies = no anon/auth access)
ALTER TABLE public.mobile_login_codes ENABLE ROW LEVEL SECURITY;

-- Apple subscription state, kept current by StoreKit sync + App Store Server
-- Notifications (/api/webhooks/apple).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS apple_product_id              TEXT,
  ADD COLUMN IF NOT EXISTS apple_expires_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS apple_auto_renew              BOOLEAN,
  ADD COLUMN IF NOT EXISTS apple_environment             TEXT;

CREATE INDEX IF NOT EXISTS users_apple_otid_idx
  ON public.users (apple_original_transaction_id);

-- The Apple transaction that paid for an order. Unique so one purchase can
-- never be redeemed for two orders (replay protection).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_apple_transaction_id_uq
  ON public.orders (apple_transaction_id) WHERE apple_transaction_id IS NOT NULL;
