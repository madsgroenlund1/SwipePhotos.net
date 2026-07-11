-- Add template_id to generated_photos for full traceability
ALTER TABLE public.generated_photos ADD COLUMN IF NOT EXISTS template_id TEXT;
