-- Add email column to orders (used for linking guest checkouts before login)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email TEXT;

-- Index for efficient email-based lookup on dashboard
CREATE INDEX IF NOT EXISTS orders_email_idx ON public.orders (email) WHERE email IS NOT NULL;
