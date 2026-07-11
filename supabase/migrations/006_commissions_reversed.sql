-- Add reversed_at timestamp to commissions for refund tracking
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ;

-- Index for admin queries by status
CREATE INDEX IF NOT EXISTS commissions_status_idx ON public.commissions(status);
CREATE INDEX IF NOT EXISTS commissions_affiliate_id_idx ON public.commissions(affiliate_id);
