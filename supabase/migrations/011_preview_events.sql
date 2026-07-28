-- Track every free-preview generation attempt so we can see how many
-- visitors actually try the preview feature and how many convert to a paid order.
CREATE TABLE IF NOT EXISTS public.preview_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_id TEXT NOT NULL,
  style TEXT,
  has_tattoos BOOLEAN DEFAULT false,
  outcome TEXT NOT NULL, -- 'success' | 'partial_failure' | 'both_failed' | 'error'
  error TEXT
);

CREATE INDEX IF NOT EXISTS preview_events_created_at_idx ON public.preview_events (created_at DESC);
