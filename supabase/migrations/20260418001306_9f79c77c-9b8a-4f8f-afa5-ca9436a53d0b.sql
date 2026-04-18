CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  lat DECIMAL,
  lng DECIMAL,
  consumption_kwh_year DECIMAL,
  housing_type TEXT,
  roof_type TEXT,
  has_ac BOOLEAN,
  has_pool BOOLEAN,
  has_ev BOOLEAN,
  recommended_kwc DECIMAL,
  estimated_production_kwh DECIMAL,
  estimated_budget_min DECIMAL,
  estimated_budget_max DECIMAL,
  estimated_roi_years DECIMAL,
  invoice_photo_url TEXT,
  roof_photos_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-uploads', 'lead-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read lead-uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lead-uploads');

CREATE POLICY "Anyone can upload lead-uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lead-uploads');