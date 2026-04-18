ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS roof_ai_analysis jsonb,
  ADD COLUMN IF NOT EXISTS roof_ai_confidence text;