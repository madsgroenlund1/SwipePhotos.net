-- Country of each visit, read from Vercel's edge geo header — no external
-- lookup needed.
ALTER TABLE public.site_visits
  ADD COLUMN IF NOT EXISTS country TEXT;
