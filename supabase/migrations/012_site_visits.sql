-- Track raw page visits so /admin can show how many people (besides the
-- site owner) actually open the link / browse the site.
CREATE TABLE IF NOT EXISTS public.site_visits (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  path TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON public.site_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS site_visits_ip_idx ON public.site_visits (ip);
