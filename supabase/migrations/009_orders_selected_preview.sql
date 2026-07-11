-- Store the URL of the preview image the customer selected before checkout
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS selected_preview_url TEXT;
