-- Two fixes for a real cost incident: one order burned 328 fal.ai
-- generations for a 45-photo package (~$56 in API cost vs ~€74 revenue).
--
-- Root cause: the browser poll (/api/orders/[id]/poll) and the server cron
-- (/api/cron/poll-generating) can both call processOrderJobs for the same
-- order at the same time. Each sees the same QC-failing job and resubmits
-- it independently, and their writes to replicate_training_id race — the
-- per-entry qcRetries counter gets overwritten instead of accumulating, so
-- the intended 3-attempts-per-photo cap was never actually enforced.
--
-- Fix 1: processing_locked_at — a short-lived lock so only one invocation
-- processes a given order at a time.
-- Fix 2: a hard, order-level ceiling on TOTAL fal.ai generation calls
-- (initial submissions + every retry combined) that can never be exceeded
-- no matter what else goes wrong — set once to the package's photo count.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS processing_locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_generation_attempts INT,
  ADD COLUMN IF NOT EXISTS generation_attempts_used INT NOT NULL DEFAULT 0;
