ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS dimensioning_ai_result JSONB,
  ADD COLUMN IF NOT EXISTS v2_battery_capacity_kwh NUMERIC,
  ADD COLUMN IF NOT EXISTS v2_battery_modules INTEGER,
  ADD COLUMN IF NOT EXISTS v2_budget_min NUMERIC,
  ADD COLUMN IF NOT EXISTS v2_budget_max NUMERIC,
  ADD COLUMN IF NOT EXISTS v2_roi_years NUMERIC,
  ADD COLUMN IF NOT EXISTS personalized_message TEXT;