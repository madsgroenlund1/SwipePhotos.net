-- Add updated_at to orders so the cron job can detect stuck orders
-- (orders in "generating" status that haven't been touched in > 60 seconds)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill with created_at so existing rows aren't all treated as newly updated
UPDATE public.orders SET updated_at = created_at WHERE updated_at IS NULL OR updated_at = now();

-- Auto-update on any row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS orders_status_updated_idx ON public.orders(status, updated_at);
