-- 1. Add AI extraction fields to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS invoice_ai_extracted jsonb,
  ADD COLUMN IF NOT EXISTS invoice_ai_confidence text;

-- 2. AI call log for global daily cap
CREATE TABLE IF NOT EXISTS public.ai_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT true,
  error_code text
);

CREATE INDEX IF NOT EXISTS ai_call_log_created_at_idx
  ON public.ai_call_log (created_at DESC);

ALTER TABLE public.ai_call_log ENABLE ROW LEVEL SECURITY;

-- Public can insert (estimator has no auth)
CREATE POLICY "Anyone can log AI calls"
  ON public.ai_call_log
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can read (will be tightened to admins in Section 4)
CREATE POLICY "Authenticated users can read AI logs"
  ON public.ai_call_log
  FOR SELECT
  TO authenticated
  USING (true);