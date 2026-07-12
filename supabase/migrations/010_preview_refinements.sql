-- Preview refinement jobs — one record per quality-gate pass on a selected preview
CREATE TABLE IF NOT EXISTS public.preview_refinements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
  input_url      TEXT        NOT NULL,
  output_url     TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending',  -- pending | passed | failed
  model          TEXT        DEFAULT 'quality_gate_v1',
  request_id     TEXT,
  error          TEXT,
  retry_count    INTEGER     DEFAULT 0,
  quality_passed BOOLEAN,
  quality_details JSONB      DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

ALTER TABLE public.preview_refinements ENABLE ROW LEVEL SECURITY;

-- Service role (used by API) can insert / select all rows (no anon access needed)
